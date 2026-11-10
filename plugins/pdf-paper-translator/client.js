window.__ModuleLoader__.load({
  id: 'dsh-pdf-paper-translator',
  factory(require) {
    const React = require('react')
    const { MenuGroup, rankByName } = require('@deepseek-ai/dsh-client-ui-primitives')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React
    const API = '/pdf-translate/api'
    const HEADERS = { 'x-dsh-pdf-translate': '1' }
    const setupStages = {
      check: '正在检查安装环境…',
      python: '正在准备 Python 运行环境…',
      bundled: '正在解包插件自带的排版组件…',
      environment: '正在创建排版引擎的运行环境…',
      connect: '正在连接下载源…',
      packages: '正在解析和下载排版引擎依赖…',
      writing: '正在写入排版引擎依赖…',
      verify: '正在验证排版引擎…',
      locked: '另一个窗口正在安装排版引擎…',
    }
    const FOLDER_KEY = 'dsh-pdf-translate.output-folder'
    const languages = [
      ['en', '英语'], ['zh-CN', '简体中文'], ['ja', '日语'], ['de', '德语'], ['fr', '法语'],
    ]
    const styles = `
.dsh-pdf-panel {
  --ink: CanvasText;
  --muted: color-mix(in srgb, CanvasText 70%, Canvas);
  --line: color-mix(in srgb, CanvasText 17%, Canvas);
  --surface: color-mix(in srgb, CanvasText 4%, Canvas);
  --accent: light-dark(#414fbe, #a4afff);
  --accent-fill: #414fbe;
  --accent-wash: color-mix(in srgb, var(--accent) 8%, Canvas);
  --failure: light-dark(#a32a3b, #ff9bac);
  position: relative; display: grid; grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  flex: 1; min-width: 0; min-height: 0; overflow: hidden;
  color: var(--ink); accent-color: var(--accent);
}
.dsh-pdf-scroll { overflow: auto; padding: 38px 32px 48px; }
.dsh-pdf-panel * { box-sizing: border-box; }
.dsh-pdf-panel ::selection { background: var(--accent); color: Canvas; }
.dsh-pdf-panel :is(button, input, select, a):focus-visible {
  outline: 2px solid var(--accent); outline-offset: 2px;
}
.dsh-pdf-card { max-width: 740px; margin: 0 auto; }
.dsh-pdf-card header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
.dsh-pdf-header-icon {
  width: 44px; height: 44px; display: grid; place-items: center; flex-shrink: 0;
  border-radius: 10px; color: var(--accent); background: var(--accent-wash);
}
.dsh-pdf-card h1 { margin: 0; font-size: 1.625rem; line-height: 1.25; font-weight: 680; letter-spacing: -.02em; }
.dsh-pdf-card header p { margin: 5px 0 0; max-width: 58ch; color: var(--muted); }
.dsh-pdf-card p { line-height: 1.5; }
.dsh-pdf-upload {
  display: flex; align-items: center; gap: 8px; min-width: 0;
  border: 1px dashed color-mix(in srgb, var(--accent) 35%, var(--line));
  border-radius: 12px; background: var(--accent-wash); padding: 8px 12px;
}
.dsh-pdf-upload:focus-within {
  border-color: var(--accent); outline: 2px solid var(--accent); outline-offset: 2px;
}
.dsh-pdf-drop {
  position: relative; flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px;
  padding: 9px 2px; cursor: pointer;
}
.dsh-pdf-drop svg { flex-shrink: 0; color: var(--accent); }
.dsh-pdf-drop input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
.dsh-pdf-name { display: grid; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.dsh-pdf-name small { color: var(--muted); }
.dsh-pdf-drop-overlay {
  position: absolute; inset: 8px; z-index: 1; display: grid; place-items: center;
  pointer-events: none; text-align: center; padding: 16px;
  border: 2px dashed var(--accent); border-radius: 12px;
  color: var(--accent); background: color-mix(in srgb, Canvas 90%, var(--accent));
}
.dsh-pdf-drop-overlay > div { display: grid; justify-items: center; gap: 6px; }
.dsh-pdf-drop-overlay strong { font-size: 1.25rem; }
.dsh-pdf-drop-overlay small { color: var(--muted); }
.dsh-pdf-queue { margin-top: 12px; }
.dsh-pdf-queue-head { margin: 0 0 4px; font-size: .8125rem; color: var(--muted); }
.dsh-pdf-list { list-style: none; margin: 0; padding: 0; }
.dsh-pdf-list > li { border-top: 1px solid var(--line); padding: 8px 0; }
.dsh-pdf-queue .dsh-pdf-list { max-height: 12rem; overflow-y: auto; padding-inline: 3px; }
.dsh-pdf-queue .dsh-pdf-list > li { display: flex; align-items: center; gap: 10px; }
.dsh-pdf-queue .dsh-pdf-name { flex: 1; }
.dsh-pdf-queue .dsh-pdf-button { flex: none; }
.dsh-pdf-card fieldset { min-width: 0; margin: 24px 0 12px; border: 0; padding: 0; }
.dsh-pdf-card legend { margin-bottom: 10px; padding: 0; font-size: .9375rem; font-weight: 650; }
.dsh-pdf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px 16px; }
.dsh-pdf-field { display: grid; align-content: start; gap: 5px; min-width: 0; }
.dsh-pdf-field > :is(span, label) { font-weight: 550; }
.dsh-pdf-folder-row, .dsh-pdf-actions, .dsh-pdf-dialog-head { display: flex; gap: 8px; align-items: center; }
.dsh-pdf-folder-row input { flex: 1; }
.dsh-pdf-folder-row button { flex-shrink: 0; }
.dsh-pdf-control {
  width: 100%; min-width: 0; min-height: 39px; padding: 7px 10px; color: inherit;
  background: Canvas; border: 1px solid var(--line); border-radius: 7px; font: inherit;
}
.dsh-pdf-control::placeholder { color: var(--muted); opacity: 1; }
button.dsh-pdf-control { display: flex; justify-content: space-between; align-items: center; text-align: left; cursor: pointer; }
button.dsh-pdf-control svg { flex: 0 0 auto; color: var(--muted); }
.dsh-pdf-control:not(:disabled):hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); }
.dsh-pdf-hint { margin: 0; color: var(--muted); font-size: .8125rem; }
.dsh-pdf-actions { margin-top: 14px; flex-wrap: wrap; }
.dsh-pdf-button {
  min-height: 36px; display: inline-flex; align-items: center; padding: 6px 10px;
  background: Canvas; color: inherit; border: 1px solid var(--line); border-radius: 7px;
  font: inherit; cursor: pointer; text-decoration: none; white-space: nowrap;
}
.dsh-pdf-button:not(:disabled):hover { background: var(--surface); border-color: var(--muted); }
.dsh-pdf-primary { padding-inline: 14px; background: var(--accent-fill); border-color: var(--accent-fill); color: white; font-weight: 630; }
.dsh-pdf-primary:not(:disabled):hover { background: #3543aa; border-color: #3543aa; }
.dsh-pdf-card button:disabled { opacity: .50; cursor: default; }
.dsh-pdf-activity {
  margin-top: 23px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface);
}
.dsh-pdf-activity h2 { margin: 0; font-size: .9375rem; line-height: 1.4; }
.dsh-pdf-activity-head, .dsh-pdf-usage-head { display: flex; gap: 8px 14px; align-items: baseline; justify-content: space-between; }
.dsh-pdf-activity-stage, .dsh-pdf-usage-note { margin: 3px 0 0; color: var(--muted); font-size: .8125rem; }
.dsh-pdf-current { display: block; overflow-wrap: anywhere; }
.dsh-pdf-percent, .dsh-pdf-usage dd, .dsh-pdf-usage-head span { font-variant-numeric: tabular-nums; }
.dsh-pdf-percent { color: var(--accent); font-weight: 660; }
.dsh-pdf-activity progress {
  display: block; width: 100%; height: 7px; margin: 11px 0 0;
  overflow: hidden; border: 0; border-radius: 6px; background: var(--line); color: var(--accent); appearance: none;
}
.dsh-pdf-activity progress::-webkit-progress-bar { background: var(--line); border-radius: 6px; }
.dsh-pdf-activity progress::-webkit-progress-value { background: var(--accent); border-radius: 6px; transition: width 180ms ease-out; }
.dsh-pdf-activity progress[value="100"]::-webkit-progress-value { transition: none; }
.dsh-pdf-activity progress::-moz-progress-bar { background: var(--accent); border-radius: 6px; }
.dsh-pdf-activity progress:indeterminate { appearance: auto; }
.dsh-pdf-usage { margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--line); }
.dsh-pdf-usage-head { font-size: .8125rem; }
.dsh-pdf-usage-head span { color: var(--muted); }
.dsh-pdf-usage dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; margin: 9px 0 0; }
.dsh-pdf-usage dt { color: var(--muted); font-size: .75rem; }
.dsh-pdf-usage dd { margin: 2px 0 0; font-size: .9375rem; font-weight: 640; overflow-wrap: anywhere; }
.dsh-pdf-error { color: var(--failure); }
.dsh-pdf-result { margin-top: 22px; overflow-wrap: anywhere; }
.dsh-pdf-result h2 { margin: 0 0 8px; font-size: .9375rem; }
.dsh-pdf-result li { display: grid; justify-items: start; gap: 4px; }
.dsh-pdf-result li p { margin: 0; }
.dsh-pdf-result .dsh-pdf-button {
  max-width: 100%; white-space: normal; text-align: left; color: var(--accent);
}
.dsh-pdf-result small { color: var(--muted); }
.dsh-pdf-dialog {
  width: min(430px, calc(100% - 28px)); padding: 15px; border-radius: 12px;
  color: CanvasText; background: Canvas; border: 0; box-shadow: 0 12px 42px #0005;
}
.dsh-pdf-dialog::backdrop { background: #0004; }
.dsh-pdf-dialog-head { justify-content: space-between; margin-bottom: 10px; }
.dsh-pdf-models { max-height: min(48vh, 420px); overflow: auto; margin-top: 9px; }
.dsh-pdf-model-row {
  width: 100%; display: flex; gap: 10px; justify-content: space-between; text-align: left;
  border: 0; border-radius: 5px; background: transparent; color: inherit; padding: 8px; font: inherit; cursor: pointer;
}
.dsh-pdf-model-row:hover, .dsh-pdf-model-row:focus-visible, .dsh-pdf-model-row[aria-pressed="true"] {
  background: var(--accent-wash);
}
@media (max-width: 640px) {
  .dsh-pdf-scroll { padding: 22px 16px 30px; }
  .dsh-pdf-grid { grid-template-columns: 1fr; }
  .dsh-pdf-folder-row { flex-wrap: wrap; }
  .dsh-pdf-folder-row input { flex-basis: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-pdf-activity progress::-webkit-progress-value { transition: none; }
}
`

    function PanelIcon() {
      return h('svg', {
        width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
      }, h('path', { d: 'M5 3h9l5 5v13H5z M14 3v5h5 M8 12h8l-2-2m2 6H8l2 2' }))
    }

    function field(label, control) {
      return h('label', { className: 'dsh-pdf-field' }, h('span', null, label), control)
    }

    function button(label, onClick, props = {}) {
      return h('button', { type: 'button', className: 'dsh-pdf-button', onClick, ...props }, label)
    }

    const modelKey = (provider, model) => JSON.stringify([provider, model])
    const providerRank = id => id === 'deepseek-account' ? 0 : id === 'deepseek-official' ? 1 : 2
    const jobStages = {
      upload: '上传 PDF', prepare: '准备排版引擎', process: '处理 PDF', save: '保存译文',
      done: 'PDF 已生成', cancelled: '已取消或超时', error: '生成失败',
      'Translate Paragraphs': '翻译正文', Typesetting: '重排版面',
      'Add Fonts': '嵌入字体', 'Generate drawing instructions': '生成页面',
      'Subset font': '嵌入字体', 'Save PDF': '写入 PDF',
    }
    const numberFormat = new Intl.NumberFormat('zh-CN')
    const fileDrag = event => event.dataTransfer.types.includes('Files')
    const maxPdfBytes = 60 * 1024 * 1024
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

    async function watchEngine(signal, update, install = false) {
      async function request(start = false) {
        const response = await fetch(API + (start ? '?setup=install' : ''), {
          method: start ? 'POST' : 'GET',
          headers: HEADERS,
          signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
        })
        const status = await response.json()
        if (!response.ok) throw new Error(status.error || '无法读取排版引擎状态。')
        signal.throwIfAborted()
        return status
      }

      let status = await request(install)
      update(status)
      let failures = 0
      while (status.setup?.state === 'installing') {
        await wait(failures ? 2500 : 1200)
        signal.throwIfAborted()
        try {
          status = await request()
          failures = 0
          update(status)
        } catch {
          signal.throwIfAborted()
          if (++failures === 3) throw new Error('暂时无法读取安装状态。可以重试，已有安装会继续。')
          update(null)
        }
      }
      return status
    }
    const fileSize = size => size < 1024 ? size + ' B' : size < 1024 * 1024
      ? Math.round(size / 1024) + ' KB' : (size / (1024 * 1024)).toFixed(1) + ' MB'

    async function followJob(id, signal, update) {
      while (!signal.aborted) {
        try {
          const response = await fetch(API + '?job=' + id, { headers: HEADERS, signal })
          if (response.ok) {
            const job = await response.json()
            if (signal.aborted) return
            update(job)
            if (['done', 'error', 'cancelled'].includes(job.stage)) return
          }
        } catch {
          if (signal.aborted) return
        }
        await wait(750)
      }
    }

    async function translateFile(file, settings, signal, setJob) {
      const monitor = new AbortController()
      const jobId = crypto.randomUUID()
      const query = new URLSearchParams({ ...settings, job: jobId, delivery: 'path', fileName: file.name })
      setJob({ stage: 'upload', progress: null, usage: null })
      void followJob(jobId, AbortSignal.any([monitor.signal, signal]), setJob)
      try {
        let response
        for (let attempt = 0; ; attempt++) {
          response = await fetch(API + '?' + query, {
            method: 'POST', headers: { ...HEADERS, 'content-type': 'application/pdf' }, body: file, signal,
          })
          // The previous response can arrive before the host releases its slot.
          if (response.status !== 409 || attempt >= 8) break
          await response.body?.cancel().catch(() => {})
          await wait(250)
          signal.throwIfAborted()
        }
        const contentType = response.headers.get('content-type') ?? ''
        const data = contentType.startsWith('application/json')
          ? await response.json().catch(() => null)
          : null
        signal.throwIfAborted()
        monitor.abort()
        if (data?.job) setJob(data.job)
        if (!response.ok) throw new Error(data?.error || '翻译请求失败，请重试。')
        if (data?.file?.path && data.file.name) {
          setJob(previous => ({ ...previous, stage: 'done', progress: 100 }))
          return data.file
        }

        // An already running host can still return the PDF and the saved name.
        const savedName = contentType.startsWith('application/pdf') && response.headers.get('x-dsh-pdf-output-name')
        if (savedName) {
          const name = decodeURIComponent(savedName)
          const { folder } = settings
          const separator = folder.includes('\\') ? '\\' : '/'
          const path = folder.replace(/[\\/]+$/, '') + separator + name
          let completed
          try { completed = JSON.parse(response.headers.get('x-dsh-pdf-job')) } catch {}
          setJob(previous => ({ ...previous, ...completed, stage: 'done', progress: 100 }))
          await response.body?.cancel().catch(() => {})
          return { name, path, folder }
        }
        throw new Error('翻译服务没有返回保存位置。请先检查输出文件夹，再完全退出并重新打开 Harness。')
      } finally {
        monitor.abort()
      }
    }

    function Activity({ job, name }) {
      const stage = job ? jobStages[job.stage] ?? '解析文献' : '等待开始'
      const progress = job ? job.progress : 0
      const usage = job?.usage
      const hasCounts = Boolean(usage?.reported)
      const metrics = [
        ['未缓存输入 token', usage?.inputTokens],
        ['输出 token', usage?.outputTokens],
        ['缓存读写 token', (usage?.cacheReadTokens ?? 0) + (usage?.cacheWriteTokens ?? 0)],
      ]
      let usageNote = '用量由当前模型提供方报告。'
      if (usage?.calls && usage.reported < usage.calls) {
        usageNote = usage.reported ? usage.reported + ' 次请求已返回 token 用量。' : '模型尚未返回 token 用量。'
      }
      return h('section', { className: 'dsh-pdf-activity', 'aria-labelledby': 'dsh-pdf-activity-title' },
        h('div', { className: 'dsh-pdf-activity-head' },
          h('div', null,
            h('h2', { id: 'dsh-pdf-activity-title' }, 'PDF 生成进度'),
            h('p', { className: 'dsh-pdf-activity-stage', role: 'status' },
              name && h('strong', { className: 'dsh-pdf-current' }, name), stage)),
          Number.isFinite(progress) && h('span', { className: 'dsh-pdf-percent' }, progress + '%')),
        h('progress', {
          max: 100, value: progress ?? (['error', 'cancelled'].includes(job?.stage) ? 0 : undefined),
          'aria-labelledby': 'dsh-pdf-activity-title',
        }),
        h('div', { className: 'dsh-pdf-usage' },
          h('div', { className: 'dsh-pdf-usage-head' },
            h('strong', null, '本篇 API 用量'),
            h('span', null, numberFormat.format(usage?.calls ?? 0), ' 次请求',
              hasCounts && ' · ' + numberFormat.format(usage.totalTokens) + ' token')),
          h('dl', null, ...metrics.map(([label, count]) =>
            h('div', { key: label },
              h('dt', null, label), h('dd', null, hasCounts ? numberFormat.format(count ?? 0) : '—')))),
          h('p', { className: 'dsh-pdf-usage-note' }, usageNote)))
    }

    function useHarnessModels(remote) {
      const [catalog, setCatalog] = useState(null)
      const [modelStatus, setModelStatus] = useState('loading')
      const request = useRef(0)
      const reload = useCallback(async () => {
        const generation = ++request.current
        setModelStatus('loading')
        try {
          const response = await remote.session.modelCatalog()
          if (!response.ok) throw new Error()
          if (generation !== request.current) return
          setCatalog(response.value)
          setModelStatus('ready')
        } catch {
          if (generation === request.current) setModelStatus('error')
        }
      }, [remote])
      useEffect(() => {
        const subscriptions = [
          'llm/adapters-updated', 'llm/models-updated', 'settings/document-updated',
          'credentials/record-updated', 'credentials/reference-updated',
        ].map(event => remote.$on(event, reload))
        void reload()
        return () => {
          request.current++
          subscriptions.forEach(dispose => dispose())
        }
      }, [reload, remote])
      return { catalog, modelStatus, reload }
    }

    function ModelPicker({ dialog, groups, selection, defaultKey, status, choose, reload }) {
      const [query, setQuery] = useState('')
      const visibleGroups = groups.map(group => ({
        ...group, models: rankByName(group.models, query.trim()),
      })).filter(group => group.models.length)
      return h('dialog', {
        ref: dialog, className: 'dsh-pdf-dialog', 'aria-labelledby': 'dsh-pdf-model-title',
        onClose: () => setQuery(''),
      },
      h('div', { className: 'dsh-pdf-dialog-head' },
        h('strong', { id: 'dsh-pdf-model-title' }, '选择翻译模型'),
        button('关闭', () => dialog.current.close())),
      h('input', {
        autoFocus: true, value: query, className: 'dsh-pdf-control',
        placeholder: '搜索模型', 'aria-label': '搜索模型',
        onChange: event => setQuery(event.target.value),
      }),
      h('div', { className: 'dsh-pdf-models' },
        ...visibleGroups.map(group => h(MenuGroup, {
          key: group.id, label: group.id === 'deepseek-account' ? 'DeepSeek 账号' : group.name,
        }, ...group.models.map(model => {
          const key = modelKey(group.id, model.id)
          return h('button', {
            key, type: 'button', className: 'dsh-pdf-model-row',
            'aria-pressed': selection?.key === key,
            onClick: () => {
              choose(key)
              dialog.current.close()
            },
          },
          h('span', null, model.name),
          h('small', null, key === defaultKey ? '默认' : selection?.key === key ? '已选' : ''))
        }))),
        status === 'loading' && h('p', { role: 'status' }, '正在读取 Harness 模型…'),
        status === 'error' && h('p', { role: 'alert' }, '读取模型失败。', ' ', button('重试', reload)),
        status === 'ready' && !groups.length && h('p', { role: 'status' },
          'Harness 暂无可用模型。请检查设置中的模型提供方。', ' ', button('重试', reload)),
        status === 'ready' && groups.length > 0 && !visibleGroups.length &&
          h('p', { role: 'status' }, '没有匹配的模型。')))
    }

    function TranslationPanel({ remote }) {
      const [queue, setQueue] = useState([])
      const pending = useRef([])
      const dragDepth = useRef(0)
      const [target, setTarget] = useState('zh-CN')
      const [mode, setMode] = useState('mono')
      const [pages, setPages] = useState('')
      const [busy, setBusy] = useState(false)
      const [over, setOver] = useState(false)
      const [ready, setReady] = useState(null)
      const [setupDisconnected, setSetupDisconnected] = useState(false)
      const [modelChoice, setModelChoice] = useState('')
      const [folderChoice, setFolderChoice] = useState(() => {
        try { return localStorage.getItem(FOLDER_KEY) ?? '' } catch { return '' }
      })
      const [folderBusy, setFolderBusy] = useState(false)
      const [error, setError] = useState('')
      const [uploadError, setUploadError] = useState('')
      const [results, setResults] = useState([])
      const [currentName, setCurrentName] = useState('')
      const [job, setJob] = useState(null)
      const task = useRef(null)
      const dialog = useRef(null)
      const { catalog, modelStatus, reload } = useHarnessModels(remote)
      const groups = (catalog?.groups ?? []).toSorted((left, right) => providerRank(left.id) - providerRank(right.id))
      const defaultKey = catalog?.default ? modelKey(catalog.default.provider, catalog.default.model) : ''
      const selection = groups.flatMap(group => group.models.map(model => ({
        provider: group.id, model: model.id, name: model.name, key: modelKey(group.id, model.id),
      }))).find(model => model.key === (modelChoice || defaultKey))
      const folder = folderChoice.trim() || ready?.outputFolder || ''
      const installing = ready?.setup?.state === 'installing'

      function updateEngine(status) {
        setSetupDisconnected(!status)
        if (status) setReady(status)
      }

      useEffect(() => {
        if (busy) return
        const request = new AbortController()
        void watchEngine(request.signal, updateEngine).catch(() => {
          if (!request.signal.aborted) setError('暂时无法连接本机翻译服务。')
        })
        return () => request.abort()
      }, [busy])

      useEffect(() => () => task.current?.abort(), [])

      function updateQueue(next) {
        pending.current = next
        setQueue(next)
      }

      function addFiles(picked) {
        if (!picked.length) return
        const valid = Array.from(picked).filter(file => /\.pdf$/i.test(file.name) && file.size > 0 && file.size <= maxPdfBytes)
        const skipped = picked.length - valid.length
        setUploadError(skipped ? skipped + ' 个文件未加入。请选择非空、单份不超过 60 MB 的 PDF。' : '')
        if (valid.length) updateQueue([...pending.current, ...valid.map(file => ({ id: crypto.randomUUID(), file }))])
      }

      function enterDropArea(event) {
        if (!fileDrag(event)) return
        event.preventDefault()
        event.stopPropagation()
        dragDepth.current++
        setOver(true)
      }

      function leaveDropArea(event) {
        if (!dragDepth.current) return
        dragDepth.current--
        if (!dragDepth.current || (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget))) {
          dragDepth.current = 0
          setOver(false)
        }
      }

      function dropFiles(event) {
        if (!fileDrag(event) && !event.dataTransfer.files.length) return
        event.preventDefault()
        event.stopPropagation()
        dragDepth.current = 0
        setOver(false)
        addFiles(event.dataTransfer.files)
      }

      function changeFolder(value) {
        setFolderChoice(value)
        try { localStorage.setItem(FOLDER_KEY, value) } catch {}
      }

      async function chooseFolder() {
        setFolderBusy(true)
        setError('')
        try {
          let picked
          if (window.__DSH_DIRECTORY_PICKER__) {
            picked = await window.__DSH_DIRECTORY_PICKER__.pick()
          } else {
            const result = await remote.directoryPicker.pick()
            if (!result.ok) throw new Error()
            picked = result.value
          }
          if (picked) changeFolder(picked)
        } catch {
          setError('无法打开文件夹选择器。也可以直接输入本机路径。')
        } finally {
          setFolderBusy(false)
        }
      }

      async function openPath(path, errorMessage) {
        setError('')
        try {
          const result = await remote.session.openWorkspacePath({ path })
          if (!result.ok || !result.value.opened) throw new Error()
        } catch {
          setError(errorMessage)
        }
      }

      async function start(event) {
        event.preventDefault()
        if (task.current || !pending.current.length || !selection ||
            !(ready?.engine || ready?.autoInstall) || !folder || folderBusy) return
        setError('')
        const controller = new AbortController()
        const { signal } = controller
        const settings = { target, mode, pages, folder, provider: selection.provider, model: selection.model }
        task.current = controller
        setBusy(true)
        try {
          if (!ready.engine) {
            const status = await watchEngine(signal, updateEngine, true)
            if (!status.engine) {
              if (!status.setup?.error) setError('排版引擎尚未就绪，请重试。')
              return
            }
          }
          while (!signal.aborted && pending.current.length) {
            const [entry, ...remaining] = pending.current
            const name = entry.file.name
            updateQueue(remaining)
            setCurrentName(name)
            try {
              const output = await translateFile(entry.file, settings, signal, setJob)
              setResults(previous => [...previous, { id: entry.id, output }])
            } catch (cause) {
              const message = signal.aborted ? '已取消翻译。' : cause.message
              setJob(previous => ({ ...previous, stage: signal.aborted ? 'cancelled' : 'error' }))
              setResults(previous => [...previous, { id: entry.id, name, message, cancelled: signal.aborted }])
            }
          }
        } catch (cause) {
          if (!signal.aborted) setError(cause.message || '无法准备排版引擎，请重试。')
        } finally {
          task.current = null
          setBusy(false)
        }
      }

      function openModels() {
        dialog.current.showModal()
        if (modelStatus !== 'ready') void reload()
      }

      return h('section', {
        className: 'dsh-pdf-panel', onDragEnter: enterDropArea, onDragLeave: leaveDropArea, onDrop: dropFiles,
        onDragOver: event => {
          if (!fileDrag(event)) return
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = 'copy'
          if (!dragDepth.current) dragDepth.current = 1
          setOver(true)
        },
      },
        h('style', null, styles),
        over && h('div', { className: 'dsh-pdf-drop-overlay', 'aria-hidden': true },
          h('div', null, h(PanelIcon), h('strong', null, '松开即可加入翻译队列'),
            h('small', null, '可拖入多份 PDF，单份最大 60 MB'))),
        h('div', { className: 'dsh-pdf-scroll' }, h('div', { className: 'dsh-pdf-card' },
          h('header', null,
            h('span', { className: 'dsh-pdf-header-icon' }, h(PanelIcon)),
            h('div', null,
              h('h1', null, 'PDF 文献翻译'),
              h('p', null, '上传论文，生成保留原版面结构的译文或逐页对照 PDF。'))),
          h('form', { onSubmit: start },
            h('div', { className: 'dsh-pdf-upload' },
            h('label', { className: 'dsh-pdf-drop' },
              h('svg', {
                width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
                strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
              }, h('path', { d: 'M12 16V4m-5 5 5-5 5 5M5 15v5h14v-5' })),
              h('span', { className: 'dsh-pdf-name' },
                h('strong', null, '选择 PDF'),
                h('small', null, '也可拖到页面任意位置 · 支持多选，单份最大 60 MB')),
              h('input', {
                type: 'file', accept: '.pdf,application/pdf', multiple: true, 'aria-label': '选择 PDF',
                onChange: event => { addFiles(event.target.files); event.target.value = '' },
              }))),
            uploadError && h('p', { className: 'dsh-pdf-hint dsh-pdf-error', role: 'alert' }, uploadError),
            queue.length > 0 && h('section', { className: 'dsh-pdf-queue', 'aria-labelledby': 'dsh-pdf-queue-title' },
              h('h2', { id: 'dsh-pdf-queue-title', className: 'dsh-pdf-queue-head' }, '等待翻译 · ', queue.length, ' 篇'),
              h('ol', { className: 'dsh-pdf-list' }, ...queue.map(({ id, file }) =>
                h('li', { key: id },
                  h('div', { className: 'dsh-pdf-name' },
                    h('span', null, file.name),
                    h('small', null, fileSize(file.size))),
                  button('移除', () => updateQueue(pending.current.filter(entry => entry.id !== id)),
                    { 'aria-label': '移除 ' + file.name }))))),
            h('fieldset', { disabled: busy },
              h('legend', null, '翻译设置'),
              h('div', { className: 'dsh-pdf-grid' },
                field('目标语言', h('select', {
                  className: 'dsh-pdf-control', value: target, onChange: event => setTarget(event.target.value),
                }, ...languages.map(([code, name]) => h('option', { key: code, value: code }, name)))),
                field('输出形式', h('select', {
                  className: 'dsh-pdf-control', value: mode, onChange: event => setMode(event.target.value),
                }, h('option', { value: 'mono' }, '仅译文'), h('option', { value: 'dual' }, '原文与译文交替'))),
                field('页码范围', h('input', {
                  className: 'dsh-pdf-control', value: pages, maxLength: 200,
                  placeholder: '例如 1-3,5，留空翻译全文', onChange: event => setPages(event.target.value),
                })),
                h('div', { className: 'dsh-pdf-field' }, h('span', { id: 'dsh-pdf-model-label' }, '翻译模型'),
                  button(h(React.Fragment, null, h('span', null, selection?.name ?? '选择 Harness 模型'),
                    h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
                      h('path', { d: 'm4 6 4 4 4-4', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }))),
                    openModels, { className: 'dsh-pdf-control', 'aria-haspopup': 'dialog', 'aria-label': '翻译模型' })),
                h('div', { className: 'dsh-pdf-field', style: { gridColumn: '1 / -1' } },
                  h('label', { htmlFor: 'dsh-pdf-folder' }, '输出文件夹'),
                  h('div', { className: 'dsh-pdf-folder-row' },
                    h('input', {
                      id: 'dsh-pdf-folder', className: 'dsh-pdf-control', value: folderChoice,
                      placeholder: ready?.outputFolder ?? '本机输出路径', title: folder,
                      onChange: event => changeFolder(event.target.value),
                    }),
                    button('更改…', chooseFolder, { disabled: folderBusy }),
                    button('打开文件夹', () => openPath(folder, '无法打开输出文件夹，请检查路径。'), { disabled: !folder }))))),
            h('p', { className: 'dsh-pdf-hint' }, '本批文献使用相同设置，模型会自动判断原文语言。'),
            ready && !ready.engine && h('div', { 'aria-busy': installing },
              installing
                ? h(React.Fragment, null,
                  h('p', { className: 'dsh-pdf-hint', role: 'status' }, setupStages[ready.setup.stage],
                    ready.setup.source && ' 当前来源：' + ready.setup.source),
                  setupDisconnected && h('p', { className: 'dsh-pdf-hint', role: 'status' }, '暂时无法读取安装状态，正在重连。'),
                  ready.setup.previousIssue && h('p', { className: 'dsh-pdf-hint' }, '上一次尝试：' + ready.setup.previousIssue),
                  h('div', { className: 'dsh-pdf-activity' }, h('progress', { 'aria-label': '排版引擎安装进度' })))
                : h(React.Fragment, null,
                  ready.setup?.error && h('p', { className: 'dsh-pdf-error', role: 'alert' }, ready.setup.error),
                  h('p', { className: 'dsh-pdf-hint' }, ready.autoInstall
                    ? (ready.bundledEngine
                      ? '首次使用会自动解包插件内的排版组件，准备完成后接着翻译。'
                      : '首次使用会自动下载排版组件，准备完成后接着翻译。')
                    : '找不到排版引擎。请安装 pdf2zh_next 或检查 DSH_PDF2ZH_PATH 配置。'))),
            h('div', { className: 'dsh-pdf-actions' },
              h('button', {
                type: 'submit', className: 'dsh-pdf-button dsh-pdf-primary',
                disabled: busy || !queue.length || !(ready?.engine || ready?.autoInstall) || !selection || !folder || folderBusy,
              }, ready?.engine
                ? (busy ? '正在翻译…' : '开始翻译')
                : (busy ? '正在准备排版引擎…' : '准备并开始翻译')),
              busy && button(ready?.engine ? '停止队列' : '取消等待', () => task.current?.abort())),
            h(Activity, { job, name: currentName }),
            error && h('p', { className: 'dsh-pdf-error', role: 'alert' }, error),
            h('section', { className: 'dsh-pdf-result', hidden: !results.length, 'aria-labelledby': 'dsh-pdf-results-title' },
              h('h2', { id: 'dsh-pdf-results-title' }, '输出文件'),
              h('ol', { className: 'dsh-pdf-list', 'aria-live': 'polite', 'aria-relevant': 'additions' },
                ...results.map(({ id, output, name, message, cancelled }) =>
                  h('li', { key: id }, output
                    ? h(React.Fragment, null,
                      button(output.name, () => openPath(output.path, '无法打开译文 PDF，请检查文件是否仍在输出文件夹中。'),
                        { title: '打开译文 PDF' }),
                      h('small', null, output.folder))
                    : h(React.Fragment, null,
                      h('strong', null, name),
                      h('p', { className: cancelled ? 'dsh-pdf-hint' : 'dsh-pdf-hint dsh-pdf-error' }, message))))))),
          h(ModelPicker, { dialog, groups, selection, defaultKey, status: modelStatus, choose: setModelChoice, reload }))))
    }

    return {
      inject: ['slots', 'remote', 'remote.session'],
      apply(ctx) {
        const remote = ctx.remote
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: 'pdf-translate', order: 26, label: 'PDF 文献翻译' }, PanelIcon))
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'pdf-translate' }, () => h(TranslationPanel, { remote })))
      },
    }
  },
})
