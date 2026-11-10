import { constants, createReadStream } from 'node:fs'
import { copyFile, mkdir, mkdtemp, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import os from 'node:os'
import path from 'node:path'

import { canInstallEngine, engineAvailable, engineSetupProgress, hasBundledEngine, installEngine, json, readBytes, translatePdf } from './engine.js'

export const inject = ['webServer', 'agentDefaultModel', 'llm']
const API = '/pdf-translate/api'
const MAX_BYTES = 60 * 1024 * 1024
const LANGUAGES = new Set(['en', 'zh-CN', 'ja', 'de', 'fr'])
const DEFAULT_FOLDER = path.join(os.homedir(), 'Downloads')
const JOB_ID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i

function readOptions(url) {
  const target = url.searchParams.get('target') || 'zh-CN'
  const mode = url.searchParams.get('mode') || 'mono'
  const pages = (url.searchParams.get('pages') || '').replace(/\s+/g, '')
  if (!LANGUAGES.has(target)) throw new Error('请选择有效的目标语言。')
  if (mode !== 'mono' && mode !== 'dual') throw new Error('请选择有效的输出形式。')
  if (pages && (pages.length > 200 || !/^[1-9]\d*(?:-[1-9]\d*)?(?:,[1-9]\d*(?:-[1-9]\d*)?)*$/.test(pages) ||
      pages.split(',').some(range => {
        const [first, last = first] = range.split('-').map(Number)
        return first > last || last > 100_000
      }))) {
    throw new Error('请用 1-3,5 这样的格式填写页码，或留空以翻译全文。')
  }
  return { target, mode, pages }
}

async function resolveModel(ctx, params) {
  const selection = params.has('provider') || params.has('model')
    ? { provider: params.get('provider'), model: params.get('model') }
    : ctx.agentDefaultModel.currentSelection()
  if (!selection?.provider || !selection.model ||
      !ctx.llm.listProviders().some(provider => provider.id === selection.provider) ||
      !(await ctx.llm.listModels(selection.provider)).some(model => model.id === selection.model)) {
    throw new Error('所选模型当前不可用，请重新选择 Harness 模型。')
  }
  return { llm: ctx.llm, provider: selection.provider, model: selection.model }
}

async function resolveFolder(value) {
  const folder = value.trim() || DEFAULT_FOLDER
  if (!path.isAbsolute(folder) || folder.includes('\0')) {
    throw new Error('请选择本机的输出文件夹。')
  }
  try {
    if (folder === DEFAULT_FOLDER) await mkdir(folder, { recursive: true })
    const resolved = await realpath(folder)
    if (!(await stat(resolved)).isDirectory()) throw new Error()
    return resolved
  } catch {
    throw new Error('无法访问该输出文件夹，请重新选择。')
  }
}

async function savePdf(result, folder, originalName, { target, mode }) {
  const base = (originalName || '文献').replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 80) || '文献'
  const stem = base + '-' + target + '-' + mode
  for (let version = 1; version <= 1000; version++) {
    const name = stem + (version === 1 ? '' : ' (' + version + ')') + '.pdf'
    try {
      await copyFile(result, path.join(folder, name), constants.COPYFILE_EXCL)
      return name
    } catch (error) {
      if (error.code !== 'EEXIST') throw new Error('无法保存译文 PDF，请检查输出文件夹的写入权限。')
    }
  }
  throw new Error('此文件夹的同名译文过多，请改用其他输出文件夹。')
}

export function apply(ctx) {
  ctx.effect(() => {
    let active
    let latestJob
    let setup
    async function status() {
      return {
        engine: setup?.state !== 'installing' && await engineAvailable(),
        autoInstall: canInstallEngine(), bundledEngine: hasBundledEngine(), setup, outputFolder: DEFAULT_FOLDER,
        download: setup?.stage === 'download' ? await engineSetupProgress() : undefined,
      }
    }
    const unregister = ctx.webServer.register({
      kind: 'exact',
      path: API,
      async handler(req, res) {
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) ||
            req.headers['x-dsh-pdf-translate'] !== '1') {
          json(res, 403, { error: '请从本机 Harness 的 PDF 文献翻译面板发起请求。' })
          return
        }
        const url = new URL(req.url, 'http://127.0.0.1')
        const jobId = url.searchParams.get('job')
        if (req.method === 'GET') {
          if (jobId) {
            if (latestJob?.id === jobId) json(res, 200, latestJob)
            else json(res, 404, { error: '找不到该翻译任务。' })
          } else {
            json(res, 200, await status())
          }
          return
        }
        if (req.method === 'POST' && url.searchParams.get('setup') === 'install') {
          if (!canInstallEngine()) {
            json(res, 409, { error: '当前环境需要手动配置排版引擎。' })
            return
          }
          if (setup?.state !== 'installing') {
            setup = { state: 'installing', stage: 'check' }
            void installEngine(update => { Object.assign(setup, update) }).then(
              () => { setup = { state: 'ready' } },
              error => { setup = { state: 'error', error: error.message } },
            )
          }
          json(res, 202, await status())
          return
        }
        if (req.method !== 'POST' || req.headers['content-type'] !== 'application/pdf') {
          json(res, 415, { error: '请上传 PDF 文件。' })
          return
        }
        if (active) {
          json(res, 409, { error: '已有 PDF 正在翻译，请等待当前任务完成。' })
          return
        }
        if (Number(req.headers['content-length']) > MAX_BYTES) {
          json(res, 413, { error: 'PDF 大小上限为 60 MB。' })
          return
        }
        if (jobId !== null && !JOB_ID.test(jobId)) {
          json(res, 400, { error: '翻译任务标识无效。' })
          return
        }

        const controller = new AbortController()
        active = controller
        const job = { id: jobId, stage: 'upload', progress: null, usage: null }
        if (jobId) latestJob = job
        function updateJob(change) {
          const progress = Number.isFinite(change.progress)
            ? Math.max(job.progress ?? 0, change.progress)
            : job.progress
          Object.assign(job, change, { progress })
        }
        const cancel = () => { if (!res.writableEnded) controller.abort() }
        res.on('close', cancel)
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(45 * 60_000)])
        let directory
        try {
          const options = readOptions(url)
          const returnFilePath = url.searchParams.get('delivery') === 'path'
          if (setup?.state === 'installing' || !await engineAvailable()) {
            throw new Error('PDF 排版引擎尚未就绪。请先在翻译面板完成安装。')
          }
          const route = await resolveModel(ctx, url.searchParams)
          const folder = returnFilePath || url.searchParams.has('folder')
            ? await resolveFolder(url.searchParams.get('folder') ?? '')
            : null
          const input = await readBytes(req, MAX_BYTES)
          if (!input.subarray(0, 1024).includes('%PDF-')) throw new Error('上传的文件没有有效的 PDF 文件头。')
          signal.throwIfAborted()
          directory = await mkdtemp(path.join(os.tmpdir(), 'dsh-pdf-translate-'))
          await writeFile(path.join(directory, 'paper.pdf'), input)
          updateJob({ stage: 'prepare' })
          const result = await translatePdf(directory, options, route, signal, updateJob)
          signal.throwIfAborted()
          updateJob({ stage: 'save', progress: 99 })
          const saved = folder ? await savePdf(result, folder, url.searchParams.get('fileName'), options) : null
          if (returnFilePath && saved) {
            updateJob({ stage: 'done', progress: 100 })
            json(res, 200, { file: { name: saved, path: path.join(folder, saved), folder }, job })
            return
          }
          const size = (await stat(result)).size
          updateJob({ stage: 'done', progress: 100 })
          res.writeHead(200, {
            'content-type': 'application/pdf',
            'content-length': size,
            'content-disposition': 'attachment; filename="translation.pdf"',
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
            ...(saved ? { 'x-dsh-pdf-output-name': encodeURIComponent(saved) } : {}),
            ...(jobId ? { 'x-dsh-pdf-job': JSON.stringify(job) } : {}),
          })
          await pipeline(createReadStream(result), res)
        } catch (error) {
          if (job.stage !== 'done') updateJob({ stage: signal.aborted ? 'cancelled' : 'error' })
          if (!res.headersSent && !res.destroyed) {
            json(res, error.status || (signal.aborted ? 408 : 422), {
              error: signal.aborted ? '翻译已取消或超时。' : error.message,
              ...(jobId ? { job } : {}),
            })
          }
        } finally {
          res.off('close', cancel)
          active = undefined
          if (directory) await rm(directory, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
        }
      },
    })
    return () => {
      active?.abort()
      unregister()
    }
  })
}
