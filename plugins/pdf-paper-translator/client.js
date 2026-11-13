window.__ModuleLoader__.load({
  id: '@local/dsh-pdf-translate',
  factory(require) {
    const React = require('react')
    const { MenuGroup, rankByName } = require('@deepseek-ai/dsh-client-ui-primitives')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState, useSyncExternalStore } = React
    const API = '/pdf-translate/api'
    const HEADERS = { 'x-dsh-pdf-translate': '1' }
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
.dsh-pdf-drop:has(input:disabled), .dsh-pdf-drop input:disabled { cursor: default; }
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
.dsh-pdf-schedule-button { gap: 6px; }
.dsh-pdf-schedule-button svg { color: var(--muted); }
.dsh-pdf-schedule-button[aria-expanded="true"]:not(:disabled) { color: var(--accent); background: var(--accent-wash); }
.dsh-pdf-schedule {
  margin-top: 10px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px;
  container-type: inline-size;
}
.dsh-pdf-schedule h2 { margin: 0; font-size: .9375rem; }
.dsh-pdf-schedule .dsh-pdf-field { margin: 8px 0 16px; max-width: 330px; }
.dsh-pdf-schedule .dsh-pdf-field > span { font-size: .8125rem; }
.dsh-pdf-schedule input, .dsh-pdf-schedule-status time { font-variant-numeric: tabular-nums; }
.dsh-pdf-schedule-confirm { justify-content: flex-end; margin-top: 10px; }
.dsh-pdf-schedule-status { margin-top: 8px; font-size: .8125rem; }
.dsh-pdf-schedule-status strong { color: var(--accent); }
.dsh-pdf-rate-guide {
  --offpeak-ink: light-dark(#1c6557, #a2e2cf);
  --offpeak-fill: light-dark(#e5f4ee, #193c34);
  --peak-ink: light-dark(#78531f, #f1cd97);
  --peak-fill: light-dark(#f7eedc, #403322);
  margin: 0 0 10px; padding: 12px; border-radius: 8px; background: var(--surface);
}
.dsh-pdf-rate-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4px 12px; flex-wrap: wrap; }
.dsh-pdf-rate-head strong { color: var(--offpeak-ink); }
.dsh-pdf-rate-head a { color: var(--accent); font-size: .75rem; text-underline-offset: .18em; }
.dsh-pdf-rate-guide p { margin: 3px 0 7px; }
.dsh-pdf-rate-guide .dsh-pdf-rate-note { margin: 7px 0 0; font-size: .75rem; }
.dsh-pdf-rate-track {
  display: grid; grid-template-columns: 9fr 3fr 2fr 4fr 6fr; gap: 2px;
}
.dsh-pdf-rate-track span, .dsh-pdf-rate-weekend {
  min-width: 0; padding: 5px 0; border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 4px; text-align: center; font-size: .75rem; white-space: nowrap;
  color: var(--offpeak-ink); background: var(--offpeak-fill);
}
.dsh-pdf-rate-track .dsh-pdf-peak { color: var(--peak-ink); background: var(--peak-fill); }
.dsh-pdf-rate-scale {
  position: relative; height: 21px; color: var(--muted); font-variant-numeric: tabular-nums; font-size: .6875rem;
}
.dsh-pdf-rate-scale span { position: absolute; top: 2px; transform: translateX(-50%); }
.dsh-pdf-rate-scale span:first-child { transform: none; }
.dsh-pdf-rate-scale span:last-child { transform: translateX(-100%); }
@container (max-width: 320px) {
  .dsh-pdf-rate-track { grid-template-columns: 9fr 3fr minmax(24px, 2fr) 4fr 6fr; }
  .dsh-pdf-rate-track span { font-size: .6875rem; }
  .dsh-pdf-rate-weekend { white-space: normal; }
}
.dsh-pdf-card button:disabled { opacity: .50; cursor: default; }
.dsh-pdf-activity {
  margin-top: 23px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface);
  container-type: inline-size;
}
.dsh-pdf-activity h2 { margin: 0; font-size: .9375rem; line-height: 1.4; }
.dsh-pdf-activity-head { display: flex; gap: 8px 14px; align-items: baseline; justify-content: space-between; }
.dsh-pdf-activity-head > :first-child { min-width: 0; }
.dsh-pdf-activity-status { display: flex; align-items: center; gap: 7px; flex: none; }
.dsh-pdf-activity-refresh { min-height: 28px; padding: 3px 8px; font-size: .75rem; }
.dsh-pdf-spinner {
  width: 14px; height: 14px; border: 2px solid var(--line); border-top-color: var(--accent);
  border-radius: 50%; animation: dsh-pdf-spin 800ms linear infinite;
}
@keyframes dsh-pdf-spin {
  to { transform: rotate(1turn); }
}
.dsh-pdf-activity-stage, .dsh-pdf-usage-note { margin: 3px 0 0; color: var(--muted); font-size: .8125rem; }
.dsh-pdf-current { display: block; overflow-wrap: anywhere; }
.dsh-pdf-percent, .dsh-pdf-usage { font-variant-numeric: tabular-nums; }
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
.dsh-pdf-usage {
  --usage-input: var(--accent);
  --usage-output: light-dark(#2a827d, #73c7c0);
  --usage-cache: light-dark(#7a81a1, #a2a8c4);
  margin-top: 12px; padding-top: 11px; border-top: 1px solid var(--line);
}
.dsh-pdf-usage-row { display: flex; align-items: center; justify-content: space-between; gap: 12px 24px; }
.dsh-pdf-usage-summary { display: flex; align-items: center; min-width: 0; gap: 11px; }
.dsh-pdf-usage-ring {
  flex: 0 0 auto; width: 50px; height: 50px; border-radius: 50%;
  mask-image: radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px));
}
.dsh-pdf-usage-summary h3 { margin: 0; font-size: .8125rem; font-weight: 640; }
.dsh-pdf-usage-total { display: block; margin: 2px 0; color: var(--muted); font-size: .75rem; }
.dsh-pdf-usage-total strong { color: var(--ink); font-size: 1.25rem; line-height: 1.15; font-weight: 680; letter-spacing: -.025em; }
.dsh-pdf-usage-requests { color: var(--muted); font-size: .75rem; }
.dsh-pdf-usage dl { flex: 1; max-width: 420px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; }
.dsh-pdf-usage dl > div { padding-inline: 12px 4px; border-inline-start: 1px solid var(--line); }
.dsh-pdf-usage dt { display: flex; align-items: baseline; gap: 5px; color: var(--muted); font-size: .75rem; }
.dsh-pdf-usage dt::before { content: ''; flex: 0 0 6px; height: 6px; border-radius: 50%; background: var(--usage-color); }
.dsh-pdf-usage dd { margin: 3px 0 0; font-size: .9375rem; font-weight: 640; overflow-wrap: anywhere; }
.dsh-pdf-usage-input { --usage-color: var(--usage-input); }
.dsh-pdf-usage-output { --usage-color: var(--usage-output); }
.dsh-pdf-usage-cache { --usage-color: var(--usage-cache); }
@container (max-width: 440px) {
  .dsh-pdf-usage-row { flex-wrap: wrap; }
  .dsh-pdf-usage dl { flex-basis: 100%; padding-top: 9px; border-top: 1px solid var(--line); }
  .dsh-pdf-usage dl > div:first-child { padding-inline-start: 0; border-inline-start: 0; }
}
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
.dsh-pdf-author-button { margin-inline-start: auto; }
.dsh-pdf-author-dialog { width: min(488px, calc(100% - 28px)); max-height: calc(100% - 28px); padding: 16px 18px; }
.dsh-pdf-author-dialog h2 { margin: 0; font-size: 1rem; }
.dsh-pdf-author-channels {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;
}
.dsh-pdf-author-channel { display: grid; justify-items: center; align-content: start; gap: 8px; min-width: 0; text-align: center; }
.dsh-pdf-author-channel h3 { margin: 0; font-size: .875rem; font-weight: 630; }
/* 三个渠道都用同一种白底方框，圆形与方形二维码因此看起来整齐一致 */
.dsh-pdf-qr-frame {
  position: relative; display: grid; place-items: center; width: 100%; padding: 6px;
  border: 1px solid var(--border, #e3e6ea); border-radius: 12px; background: #fff;
}
.dsh-pdf-qr-frame--bilibili {
  border-color: #fb7299;
  box-shadow: 0 0 0 1px #fb7299 inset, 0 8px 18px -13px #fb7299;
}
.dsh-pdf-qr-badge {
  position: absolute; top: -7px; right: -5px;
  padding: 2px 8px; border-radius: 999px; background: #fb7299; color: #fff;
  font-size: .5625rem; font-weight: 700; letter-spacing: .1em; line-height: 1.5;
  box-shadow: 0 2px 6px -2px #fb7299; white-space: nowrap;
}
.dsh-pdf-author-qr {
  display: block; width: 100%; aspect-ratio: 1; border-radius: 6px; object-fit: contain; background: #fff;
}
/* 抖音二维码本身是圆的，等比缩进后视觉比方形码轻，稍微放大补回来；
   放大后不能压到外框，所以这一格单独裁剪溢出部分 */
.dsh-pdf-qr-frame--douyin { overflow: hidden; }
.dsh-pdf-qr-frame--douyin .dsh-pdf-author-qr { transform: scale(1.03); }
.dsh-pdf-author-channel p { max-width: 15em; }
.dsh-pdf-author-channel a { color: var(--accent); font-size: .8125rem; text-underline-offset: .18em; }
@media (max-width: 430px) {
  .dsh-pdf-author-channels { gap: 9px; }
  .dsh-pdf-author-channel h3 { font-size: .8125rem; }
  .dsh-pdf-author-channel p { font-size: .6875rem; }
  .dsh-pdf-author-channel a { font-size: .75rem; }
}
.dsh-pdf-field > .dsh-pdf-effort-note { font-weight: 400; font-size: .75rem; color: var(--text-tertiary, #8a9199); }
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
  .dsh-pdf-spinner { animation: none; }
}
@media (forced-colors: active) {
  .dsh-pdf-spinner { border-color: transparent; border-top-color: CanvasText; border-right-color: CanvasText; }
  .dsh-pdf-usage-ring, .dsh-pdf-usage dt::before { display: none; }
  .dsh-pdf-rate-track span, .dsh-pdf-rate-weekend { border-color: CanvasText; }
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
      'wait-slot': '正在等待排版引擎空闲', 'slot-busy': '排版引擎仍忙',
      done: 'PDF 已生成', cancelled: '已取消或超时', error: '生成失败',
      'Translate Paragraphs': '翻译正文', Typesetting: '重排版面',
      'Add Fonts': '嵌入字体', 'Generate drawing instructions': '生成页面',
      'Subset font': '嵌入字体', 'Save PDF': '写入 PDF',
    }
    const numberFormat = new Intl.NumberFormat('zh-CN')
    const shareFormat = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 })
    const beijingTime = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
    const offPeakHours = [0, 9, 12, 14, 18, 24]
    const timeInputValue = timestamp => new Date(timestamp + 8 * 60 * 60_000).toISOString().slice(0, 16)
    const nextMinute = () => Math.floor(Date.now() / 60_000) * 60_000 + 60_000
    const fileDrag = event => event.dataTransfer.types.includes('Files')
    const maxPdfBytes = 60 * 1024 * 1024
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

    const setupStages = {
      check: '正在查找兼容的 Python…',
      bundled: '正在校验并解包内置排版引擎…',
      'python-download': '正在下载便携 Python…',
      'python-archive': '正在校验并解包便携 Python…',
      venv: '正在创建独立的 Python 环境…',
      dependencies: '正在下载并安装排版依赖…',
      assets: '正在下载并验证版面模型、字体和字符映射…',
      verify: '正在自检排版引擎…',
      locked: '另一个窗口正在安装排版引擎…',
    }
    const setupSources = {
      nuget: 'Python 官方 NuGet', astral: 'Astral Python Build Standalone',
      tsinghua: '清华 PyPI 镜像', aliyun: '阿里云 PyPI 镜像', pypi: 'PyPI 官方源',
      modelscope: 'ModelScope（魔搭）', github: 'GitHub', huggingface: 'Hugging Face',
      offline: '本地资源 ZIP', wheelhouse: '本地 wheel 目录',
    }

    function engineProblem(health) {
      if (health.reason === 'version') {
        return '检测到 PDFMathTranslate-next ' + (health.version ?? '未知版本') +
          (health.babeldoc ? ' / BabelDOC ' + health.babeldoc : '') + '，版本需要更新。'
      }
      if (health.reason === 'assets') return '版面模型、字体或字符映射需要重新准备。'
      if (health.reason === 'broken') return '排版引擎无法启动。'
      return '尚未准备排版引擎。'
    }

    async function readStatus(signal, { query = '', method = 'GET', timeout = 32_000 } = {}) {
      const response = await fetch(API + query, {
        method, headers: HEADERS, signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
      })
      const status = await response.json()
      if (!response.ok) throw new Error(status.error || '无法读取排版引擎状态。')
      signal.throwIfAborted()
      return status
    }

    async function watchEngine(signal, update, install = false) {
      let status = await readStatus(signal, install ? { query: '?setup=install&confirm=1', method: 'POST' } : {})
      update(status)
      let failures = 0
      while (status.setup?.state === 'installing') {
        await wait(failures ? 2500 : 1200)
        signal.throwIfAborted()
        try {
          status = await readStatus(signal)
          failures = 0
          update(status)
        } catch {
          signal.throwIfAborted()
          if (++failures === 3) throw new Error('暂时无法读取安装状态。可以刷新，已有安装会继续。')
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

    class EngineSlotBusy extends Error {}

    async function waitForEngineSlot(signal, deadline) {
      while (Date.now() < deadline) {
        await wait(Math.min(500, deadline - Date.now()))
        signal.throwIfAborted()
        const remaining = deadline - Date.now()
        if (remaining <= 0) return false
        const slot = await readStatus(signal, { query: '?slot=1', timeout: Math.min(2_000, remaining) }).catch(() => null)
        signal.throwIfAborted()
        // Older hosts do not report the slot state. A bounded POST retry still works there.
        if (slot?.busy !== true) return Date.now() < deadline
      }
      return false
    }

    async function translateFile(file, settings, signal, setJob) {
      const monitor = new AbortController()
      const jobId = crypto.randomUUID()
      const query = new URLSearchParams({ ...settings, job: jobId, delivery: 'path', fileName: file.name })
      setJob({ stage: 'upload', progress: null, usage: null })
      void followJob(jobId, AbortSignal.any([monitor.signal, signal]), setJob)
      try {
        let response
        let retryDeadline
        for (;;) {
          response = await fetch(API + '?' + query, {
            method: 'POST', headers: { ...HEADERS, 'content-type': 'application/pdf' }, body: file, signal,
          })
          if (response.status !== 409) break
          await response.body?.cancel().catch(() => {})
          retryDeadline ??= Date.now() + 15_000
          setJob({ stage: 'wait-slot', progress: null, usage: null })
          if (!await waitForEngineSlot(signal, retryDeadline)) throw new EngineSlotBusy()
          signal.throwIfAborted()
          setJob({ stage: 'upload', progress: null, usage: null })
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

    function createTranslationQueue() {
      let snapshot = { queue: [], results: [], job: null, name: '', running: false, scheduled: null }
      const listeners = new Set()
      let task
      let timer

      function update(changes) {
        snapshot = { ...snapshot, ...changes }
        for (const listener of listeners) listener()
      }

      async function start(settings, background = false) {
        if (task || !snapshot.queue.length) return
        clearTimeout(timer)
        const controller = new AbortController()
        const { signal } = controller
        task = { controller, background }
        update({ running: true, scheduled: null })
        const setJob = job => update({ job: typeof job === 'function' ? job(snapshot.job) : job })
        try {
          while (!signal.aborted && snapshot.queue.length) {
            const [entry, ...remaining] = snapshot.queue
            const name = entry.file.name
            update({ queue: remaining, name })
            let result
            try {
              const output = await translateFile(entry.file, settings, signal, setJob)
              result = { id: entry.id, output }
            } catch (cause) {
              if (cause instanceof EngineSlotBusy && !signal.aborted) {
                update({ queue: [entry, ...snapshot.queue], job: { stage: 'slot-busy', progress: 0 } })
                return
              }
              const message = signal.aborted ? '已取消翻译。' : cause.message
              setJob(previous => ({ ...previous, stage: signal.aborted ? 'cancelled' : 'error' }))
              result = { id: entry.id, name, message, cancelled: signal.aborted }
            }
            update({ results: [result, ...snapshot.results] })
          }
        } finally {
          task = null
          update({ running: false })
        }
      }

      function schedule(at, settings) {
        clearTimeout(timer)
        update({ scheduled: { at, settings } })
        function tick() {
          const delay = at - Date.now()
          if (delay > 0) timer = setTimeout(tick, Math.min(delay, 60_000))
          else void start(settings, true)
        }
        tick()
      }

      return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        updateQueue(change) {
          if (!snapshot.scheduled) update({ queue: change(snapshot.queue) })
        },
        refresh(busy) {
          if (!task) update({
            job: busy ? { stage: 'slot-busy', progress: 0 } : null,
            name: '',
            results: snapshot.results.filter(result => result.output),
          })
        },
        start,
        schedule,
        cancelSchedule() {
          clearTimeout(timer)
          update({ scheduled: null })
        },
        stop() { task?.controller.abort() },
        dispose() {
          clearTimeout(timer)
          task?.controller.abort()
        },
      }
    }

    function ClockIcon() {
      return h('svg', {
        width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', 'aria-hidden': true,
      }, h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M12 7v5l3 2' }))
    }

    function RateGuide() {
      return h('figure', { className: 'dsh-pdf-rate-guide' },
        h('figcaption', { className: 'dsh-pdf-rate-head' },
          h('strong', null, '错峰 token 半价'),
          h('a', {
            href: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/',
            target: '_blank', rel: 'noreferrer',
          }, '查看官方定价')),
        h('p', { className: 'dsh-pdf-hint' }, 'DeepSeek 官方 API · 工作日 · 北京时间 UTC+8'),
        h('div', {
          className: 'dsh-pdf-rate-track', role: 'img',
          'aria-label': '工作日北京时间 09:00 至 12:00、14:00 至 18:00 为高峰，其余时段错峰。',
        }, ...offPeakHours.slice(0, -1).map((hour, index) => h('span', {
          key: hour, className: index % 2 ? 'dsh-pdf-peak' : undefined, 'aria-hidden': true,
        }, index % 2 ? '高峰' : '错峰'))),
        h('div', { className: 'dsh-pdf-rate-scale', 'aria-hidden': true },
          ...offPeakHours.map(hour => h('span', { key: hour, style: { left: (hour / 24 * 100) + '%' } }, hour))),
        h('div', { className: 'dsh-pdf-rate-weekend' }, '周末及中国法定节假日 · 全天错峰'),
        h('p', { className: 'dsh-pdf-hint dsh-pdf-rate-note' }, '每次 API 请求按当时的时段计费。'))
    }

    const authorChannels = [
      { id: 'official', label: '微信公众号', description: '扫码关注「多功能复材研究进展」，获取插件下载链接和后续版本更新。' },
      { id: 'douyin', label: '抖音', description: '抖音号 47100051658，扫码或搜索关注，看插件演示与使用技巧。' },
      { id: 'bilibili', label: 'Bilibili', description: '扫码或点击下方链接进入作者主页，交流使用问题和功能建议。' },
    ]

    function AuthorContact() {
      const dialog = useRef(null)

      return h(React.Fragment, null,
        button('联系作者', () => dialog.current.showModal(), {
          className: 'dsh-pdf-button dsh-pdf-author-button', 'aria-haspopup': 'dialog', 'aria-controls': 'dsh-pdf-author-dialog',
        }),
        h('dialog', {
          ref: dialog, id: 'dsh-pdf-author-dialog', className: 'dsh-pdf-dialog dsh-pdf-author-dialog',
          'aria-labelledby': 'dsh-pdf-author-title',
        },
          h('div', { className: 'dsh-pdf-dialog-head' },
            h('h2', { id: 'dsh-pdf-author-title' }, '联系作者'),
            button('关闭', () => dialog.current.close(), { autoFocus: true })),
          h('div', { className: 'dsh-pdf-author-channels' },
            ...authorChannels.map(({ id, label, description }) => h('div', { key: id, className: 'dsh-pdf-author-channel' },
              h('h3', null, label),
              h('div', { className: 'dsh-pdf-qr-frame dsh-pdf-qr-frame--' + id },
                id === 'bilibili' && h('span', { className: 'dsh-pdf-qr-badge' }, 'BILIBILI'),
                h('img', { className: 'dsh-pdf-author-qr', src: authorImages[id], alt: label + '二维码' })),
              h('p', { className: 'dsh-pdf-hint' }, description),
              id === 'bilibili' && h('a', {
                href: 'https://b23.tv/eZcKprk', target: '_blank', rel: 'noopener noreferrer',
              }, '访问 Bilibili 主页'))))))
    }

    function Activity({ job, name, scheduled, running, refresh, refreshing, refreshNote }) {
      const stage = job ? jobStages[job.stage] ?? '解析文献' : scheduled ? '等待定时开始' : '等待开始'
      const progress = job ? job.progress : 0
      const usage = job?.usage
      const calls = usage?.calls ?? 0
      const hasCounts = Boolean(usage?.reported)
      const metrics = [
        ['input', '未缓存输入', usage?.inputTokens ?? 0],
        ['output', '输出', usage?.outputTokens ?? 0],
        ['cache', '缓存读写', (usage?.cacheReadTokens ?? 0) + (usage?.cacheWriteTokens ?? 0)],
      ]
      const breakdown = metrics.reduce((sum, [, , count]) => sum + count, 0)
      const hasBreakdown = hasCounts && (breakdown > 0 || usage.totalTokens === 0)
      const segments = hasBreakdown ? metrics.filter(([, , count]) => count > 0) : []
      const chartLabel = '已返回的 token 分项占比 · ' + segments.map(([, label, count]) =>
        label + ' ' + shareFormat.format(count / breakdown)).join(' · ')
      let cumulative = 0
      const stops = segments.map(([key, , count]) => {
        const start = cumulative / breakdown * 100
        cumulative += count
        return 'var(--usage-' + key + ') ' + start + '% ' + (cumulative / breakdown * 100) + '%'
      })
      let usageNote
      if (!hasCounts) {
        usageNote = calls ? '模型尚未返回 token 用量。' : '模型返回用量后会显示 token 统计。'
      } else if (usage.reported < calls) {
        // 差额是命中翻译记忆与引擎探测，这两类没调模型，本来就不该有用量。
        usageNote = numberFormat.format(usage.reported) + ' 次调用模型 · ' +
          numberFormat.format(calls - usage.reported) + ' 次命中缓存或探测，未计费'
      } else if (!hasBreakdown) {
        usageNote = '模型只返回了 token 总量。'
      } else if (breakdown !== usage.totalTokens) {
        usageNote = '占比按模型返回的分项用量计算。'
      }
      return h('section', { className: 'dsh-pdf-activity', 'aria-labelledby': 'dsh-pdf-activity-title' },
        h('div', { className: 'dsh-pdf-activity-head' },
          h('div', null,
            h('h2', { id: 'dsh-pdf-activity-title' }, 'PDF 生成进度'),
            h('p', { className: 'dsh-pdf-activity-stage', role: 'status' },
              name && h('strong', { className: 'dsh-pdf-current' }, name), stage)),
          h('div', { className: 'dsh-pdf-activity-status' },
            running && h('span', { className: 'dsh-pdf-spinner', 'aria-hidden': true }),
            Number.isFinite(progress) && h('span', { className: 'dsh-pdf-percent' }, progress + '%'),
            button(refreshing ? '刷新中…' : '刷新状态', refresh, {
              className: 'dsh-pdf-button dsh-pdf-activity-refresh', disabled: refreshing,
            }))),
        h('progress', {
          max: 100, value: progress ?? (['error', 'cancelled'].includes(job?.stage) ? 0 : undefined),
          'aria-labelledby': 'dsh-pdf-activity-title',
        }),
        job?.stage === 'slot-busy' && name && h('p', { className: 'dsh-pdf-activity-stage' }, '待译文件已保留。可刷新状态后重试。'),
        refreshNote && h('p', { className: 'dsh-pdf-activity-stage', role: 'status' }, refreshNote),
        h('section', { className: 'dsh-pdf-usage', 'aria-labelledby': 'dsh-pdf-usage-title' },
          h('div', { className: 'dsh-pdf-usage-row' },
            h('div', { className: 'dsh-pdf-usage-summary', title: '用量由当前模型提供方报告。' },
              stops.length > 0 && h('div', {
                className: 'dsh-pdf-usage-ring', role: 'img', 'aria-label': chartLabel, title: chartLabel,
                style: { background: 'conic-gradient(' + stops.join(', ') + ')' },
              }),
              h('div', null,
                h('h3', { id: 'dsh-pdf-usage-title' }, '本篇 API 用量'),
                hasCounts && h('span', { className: 'dsh-pdf-usage-total' },
                  h('strong', null, numberFormat.format(usage.totalTokens)), ' token'),
                h('span', { className: 'dsh-pdf-usage-requests' }, numberFormat.format(calls), ' 次请求'))),
            hasBreakdown && h('dl', null, ...metrics.map(([key, label, count]) =>
              h('div', { key, className: 'dsh-pdf-usage-' + key },
                h('dt', null, label), h('dd', null, numberFormat.format(count)))))),
          usageNote && h('p', { className: 'dsh-pdf-usage-note' }, usageNote)))
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

    function TranslationPanel({ remote, batch }) {
      const { queue, results, job, name: currentName, running, scheduled } = useSyncExternalStore(batch.subscribe, batch.getSnapshot)
      const dragDepth = useRef(0)
      const [target, setTarget] = useState(scheduled?.settings.target ?? 'zh-CN')
      const [mode, setMode] = useState(scheduled?.settings.mode ?? 'mono')
      const [pages, setPages] = useState(scheduled?.settings.pages ?? '')
      const [engineBusy, setEngineBusy] = useState(false)
      const busy = running || engineBusy
      const [over, setOver] = useState(false)
      const [ready, setReady] = useState(null)
      const [setupDisconnected, setSetupDisconnected] = useState(false)
      const [diagnosing, setDiagnosing] = useState(false)
      const [diagnosis, setDiagnosis] = useState(null)
      const [modelChoice, setModelChoice] = useState(() => scheduled
        ? modelKey(scheduled.settings.provider, scheduled.settings.model) : '')
      const [folderChoice, setFolderChoice] = useState(() => {
        if (scheduled) return scheduled.settings.folder
        try { return localStorage.getItem(FOLDER_KEY) ?? '' } catch { return '' }
      })
      const [folderBusy, setFolderBusy] = useState(false)
      const [error, setError] = useState('')
      const [refreshing, setRefreshing] = useState(false)
      const [refreshNote, setRefreshNote] = useState('')
      const refreshTask = useRef(null)
      const engineTask = useRef(null)
      const [uploadError, setUploadError] = useState('')
      const [scheduleOpen, setScheduleOpen] = useState(false)
      const [scheduleValue, setScheduleValue] = useState('')
      const [scheduleError, setScheduleError] = useState('')
      const scheduleButton = useRef(null)
      const scheduleInput = useRef(null)
      const dialog = useRef(null)
      const { catalog, modelStatus, reload } = useHarnessModels(remote)
      const groups = (catalog?.groups ?? []).toSorted((left, right) => providerRank(left.id) - providerRank(right.id))
      const defaultKey = catalog?.default ? modelKey(catalog.default.provider, catalog.default.model) : ''
      const selection = groups.flatMap(group => group.models.map(model => ({
        provider: group.id, model: model.id, name: model.name, key: modelKey(group.id, model.id),
      }))).find(model => model.key === (modelChoice || defaultKey))
      const folder = folderChoice.trim() || ready?.outputFolder || ''
      const settings = { target, mode, pages, folder, provider: selection?.provider, model: selection?.model }
      const canStart = !busy && queue.length > 0 && Boolean(ready?.engine && selection && folder) && !folderBusy
      const scheduleHint = !queue.length ? '请先选择要定时翻译的 PDF。'
        : !ready?.engine ? '排版引擎就绪后即可安排定时。'
        : !selection || !folder || folderBusy ? '请确认翻译模型和输出文件夹。' : ''

      const installing = ready?.setup?.state === 'installing'
      const setupStage = ready?.setup?.stage
      const setupLabel = ready?.bundledEngine && setupStage === 'dependencies'
        ? '正在安装包内 Python 依赖…'
        : setupStages[ready?.bundledEngine && setupStage === 'check' ? 'bundled' : setupStage]
      const upstreams = ready?.setup?.upstreams
      const upstreamLabel = [
        upstreams?.fonts && '字体来源 ' + setupSources[upstreams.fonts],
        upstreams?.model && '版面模型来源 ' + setupSources[upstreams.model],
      ].filter(Boolean).join(' · ')

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

      useEffect(() => () => {
        // 切换侧边栏页面会卸载本面板，但翻译不能因此中断：任务队列是插件级
        // 单例（在 apply 里创建，只有插件卸载才 dispose），重新进入面板时
        // 会用 useSyncExternalStore 读到同一个快照，进度与结果都在。
        // 这里只放弃本视图的刷新请求，绝不 abort 正在跑的翻译。
        refreshTask.current?.abort()
        engineTask.current?.abort()
      }, [])
      useEffect(() => {
        if (running) {
          setScheduleOpen(false)
          setRefreshNote('')
        }
        else if (scheduleOpen) scheduleInput.current?.focus()
      }, [running, scheduleOpen])

      function addFiles(picked) {
        if (scheduled || !picked.length) return
        const valid = Array.from(picked).filter(file => /\.pdf$/i.test(file.name) && file.size > 0 && file.size <= maxPdfBytes)
        const skipped = picked.length - valid.length
        setUploadError(skipped ? skipped + ' 个文件未加入。请选择非空、单份不超过 60 MB 的 PDF。' : '')
        if (valid.length) batch.updateQueue(previous => [...previous, ...valid.map(file => ({ id: crypto.randomUUID(), file }))])
      }

      function enterDropArea(event) {
        if (!fileDrag(event)) return
        event.preventDefault()
        event.stopPropagation()
        if (scheduled) return
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

      async function refreshStatus() {
        if (refreshTask.current) return
        const request = new AbortController()
        const before = batch.getSnapshot()
        refreshTask.current = request
        setRefreshing(true)
        setRefreshNote('')
        try {
          const status = await readStatus(request.signal)
          updateEngine(status)
          if (batch.getSnapshot() === before) batch.refresh(Boolean(status.busy))
          setError('')
          setRefreshNote('状态已刷新。')
        } catch {
          if (!request.signal.aborted) setError('无法刷新本机翻译状态，请重试。')
        } finally {
          refreshTask.current = null
          if (!request.signal.aborted) setRefreshing(false)
        }
      }

      function start(event) {
        event.preventDefault()
        if (!canStart) return
        setError('')
        void batch.start(scheduled?.settings ?? settings, Boolean(scheduled))
      }

      function toggleSchedule() {
        if (!scheduleOpen) {
          setScheduleValue(timeInputValue(scheduled?.at ?? nextMinute()))
          setScheduleError('')
        }
        setScheduleOpen(!scheduleOpen)
      }

      function confirmSchedule(event) {
        event.preventDefault()
        if (!canStart) return
        const at = Date.parse(scheduleValue + '+08:00')
        if (!Number.isFinite(at) || at <= Date.now()) {
          setScheduleError('请选择晚于当前时间的北京时间。')
          return
        }
        batch.schedule(at, scheduled?.settings ?? settings)
        setError('')
        setScheduleOpen(false)
        scheduleButton.current?.focus()
      }

      async function prepareEngine() {
        if (busy || engineTask.current || installing || scheduled) return
        const controller = new AbortController()
        engineTask.current = controller
        setEngineBusy(true)
        setError('')
        setDiagnosis(null)
        try {
          await watchEngine(controller.signal, updateEngine, true)
        } catch (cause) {
          if (!controller.signal.aborted) setError(cause.message || '无法准备排版引擎，请重试。')
        } finally {
          engineTask.current = null
          setEngineBusy(false)
        }
      }

      async function diagnoseEngine() {
        setDiagnosing(true)
        setError('')
        try {
          const response = await fetch(API + '?doctor=1', { headers: HEADERS, signal: AbortSignal.timeout(60_000) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error)
          updateEngine(result)
          setDiagnosis(result.checks)
        } catch (cause) {
          setError(cause.message || '无法完成环境检测，请重试。')
        } finally {
          setDiagnosing(false)
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
          if (scheduled) {
            event.dataTransfer.dropEffect = 'none'
            return
          }
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
                type: 'file', accept: '.pdf,application/pdf', multiple: true, 'aria-label': '选择 PDF', disabled: Boolean(scheduled),
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
                  button('移除', () => batch.updateQueue(previous => previous.filter(entry => entry.id !== id)),
                    { 'aria-label': '移除 ' + file.name, disabled: Boolean(scheduled) }))))),
            h('fieldset', { disabled: busy || Boolean(scheduled) },
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
                    openModels, { className: 'dsh-pdf-control', 'aria-haspopup': 'dialog', 'aria-label': '翻译模型' }),
                  h('span', { className: 'dsh-pdf-effort-note' }, '已选择最低推理强度，最大节省 token 消耗')),
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
            h('p', { className: 'dsh-pdf-hint' }, '模型自动识别原文语言。待译文本由所选模型服务处理。'),
            ready && h('div', { 'aria-busy': installing || diagnosing },
              installing
                ? h(React.Fragment, null,
                  h('p', { className: 'dsh-pdf-hint', role: 'status' }, setupLabel,
                    ready.setup.source && ' 当前来源 ' + (setupSources[ready.setup.source] ?? ready.setup.source)),
                  upstreamLabel && h('p', { className: 'dsh-pdf-hint' }, upstreamLabel),
                  ready.setup.issue && h('p', { className: 'dsh-pdf-hint' }, ready.setup.issue),
                  setupDisconnected && h('p', { className: 'dsh-pdf-hint', role: 'status' }, '暂时无法读取安装状态，正在重连。'),
                  h('div', { className: 'dsh-pdf-activity' }, h('progress', {
                    'aria-label': '排版引擎安装进度',
                  })))
                : h(React.Fragment, null,
                  upstreamLabel && h('p', { className: 'dsh-pdf-hint' }, upstreamLabel),
                  !ready.engine && h(React.Fragment, null,
                    h('p', { className: 'dsh-pdf-hint' }, engineProblem(ready.health ?? {})),
                    ready.setup?.error && h('p', { className: 'dsh-pdf-error', role: 'alert' }, ready.setup.error),
                    h('p', { className: 'dsh-pdf-hint' }, ready.bundledEngine
                      ? '插件会自动在本机准备内置排版引擎。'
                      : ready.autoInstall
                      ? '安装 PDFMathTranslate-next ' + ready.engineVersion + ' 和 BabelDOC ' + ready.babeldocVersion +
                        '（AGPL-3.0）。如缺少兼容 Python，插件会从官方发行源下载便携版，并准备全部排版资源。安装位置 ' +
                        ready.engineLocation + '。'
                      : '当前环境暂不支持自动安装排版引擎。')),
                  h('div', { className: 'dsh-pdf-actions' },
                    ready.autoInstall && !ready.engine && button(
                      ready.setup?.state === 'error' ? '重试安装' : '确认安装',
                      prepareEngine, { className: 'dsh-pdf-button dsh-pdf-primary', disabled: busy || diagnosing || Boolean(scheduled) }),
                    button(diagnosing ? '正在检测…' : '环境检测', diagnoseEngine, { disabled: busy || diagnosing })),
                  diagnosis && h('ul', { className: 'dsh-pdf-hint', role: 'status' },
                    ready.autoInstall && !ready.bundledEngine && h('li', null, diagnosis.python === 'ok'
                      ? '本机 Python ' + (diagnosis.pythonVersion ?? '') + ' 可用'
                      : '未找到兼容 Python，确认安装后将自动下载便携版。'),
                    h('li', null, ready.engine ? '排版引擎 ' + ready.health.version + ' 已就绪' : engineProblem(ready.health ?? {})),
                    h('li', null, ready.health.resources === true ? '排版资源齐全'
                      : ready.autoInstall ? '确认安装后将自动准备排版资源。' : '外部引擎的资源由其安装程序管理。'),
                    ready.autoInstall && h(React.Fragment, null,
                      !ready.bundledEngine && h('li', null, '网络 · ' + (setupSources[diagnosis.pip] ?? '未连接到 Python 软件源') +
                        ' / ' + (setupSources[diagnosis.assets] ?? '未连接到排版资源源站') +
                        ((!diagnosis.pip || !diagnosis.assets) ? '。请检查网络连接。' : '')),
                      h('li', null, diagnosis.write === 'ok' ? '安装目录可写'
                        : '无法写入安装目录，请检查当前用户的写入权限。'))))),
            h('div', { className: 'dsh-pdf-actions' },
              h('button', {
                type: 'submit', className: 'dsh-pdf-button dsh-pdf-primary', disabled: !canStart,
              }, running ? '正在翻译…' : scheduled ? '立即翻译' : '开始翻译'),
              button(h(React.Fragment, null, h(ClockIcon), scheduled ? '修改定时' : '定时翻译'), toggleSchedule, {
                ref: scheduleButton, className: 'dsh-pdf-button dsh-pdf-schedule-button',
                'aria-expanded': scheduleOpen && !busy, 'aria-controls': 'dsh-pdf-schedule', disabled: busy,
              }),
              scheduled && button('取消定时', () => {
                batch.cancelSchedule()
                setScheduleOpen(false)
                scheduleButton.current?.focus()
              }),
              running && button('停止队列', batch.stop),
              h(AuthorContact))),
            scheduled && h('p', { className: 'dsh-pdf-hint dsh-pdf-schedule-status', role: 'status' },
              h('strong', null, '已定时'), ' · ',
              h('time', { dateTime: new Date(scheduled.at).toISOString() }, beijingTime.format(scheduled.at)),
              '（北京时间） · ', queue.length, ' 篇 PDF'),
            h('form', {
              id: 'dsh-pdf-schedule', className: 'dsh-pdf-schedule', hidden: !scheduleOpen || busy,
              onSubmit: confirmSchedule, 'aria-labelledby': 'dsh-pdf-schedule-title',
            },
              h('h2', { id: 'dsh-pdf-schedule-title' }, '设置开始时间'),
              field('北京时间 UTC+8', h('input', {
                ref: scheduleInput, type: 'datetime-local', className: 'dsh-pdf-control', required: true, value: scheduleValue,
                'aria-invalid': Boolean(scheduleError),
                'aria-describedby': scheduleError ? 'dsh-pdf-schedule-error' : undefined,
                onChange: event => { setScheduleValue(event.target.value); setScheduleError('') },
              })),
              h(RateGuide),
              h('p', { className: 'dsh-pdf-hint' }, '定时期间请保持电脑唤醒。退出或重启 Harness 会清除定时。'),
              !canStart && scheduleHint && h('p', { className: 'dsh-pdf-hint' }, scheduleHint),
              scheduleError && h('p', { id: 'dsh-pdf-schedule-error', className: 'dsh-pdf-hint dsh-pdf-error', role: 'alert' }, scheduleError),
              h('div', { className: 'dsh-pdf-actions dsh-pdf-schedule-confirm' },
                h('button', { type: 'submit', className: 'dsh-pdf-button dsh-pdf-primary', disabled: !canStart },
                  scheduled ? '保存时间' : '确认定时'))),
            h(Activity, { job, name: currentName, scheduled, running, refresh: refreshStatus, refreshing, refreshNote }),
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
                      h('p', { className: cancelled ? 'dsh-pdf-hint' : 'dsh-pdf-hint dsh-pdf-error' }, message)))))),
          h(ModelPicker, { dialog, groups, selection, defaultKey, status: modelStatus, choose: setModelChoice, reload }))))
    }

    // The public QR images ship with the client bundle so they work without a host request.
    const authorImages = {
      douyin: 'data:image/webp;base64,UklGRoBIAABXRUJQVlA4IHRIAADQywCdASogASABPlUijkSjoiEWbDYMOAVEtjdwYAAxsEKfOva9fi9X+ovqi17/F/2f9q+vT9e+y7pH9k/Tv5p/8/+G/y3vl/yn6n/4b4Lfn7/2f5P4A/1g/YH3Df7f9zPc7/fv9v6g/2m/an3e/9r+0/uV/r3+5/b/4Bv7N/sv/h2EHoHfuZ///Xc/eT/3fKv/bv+X+5v/n943///8b3AP//7a38A///WL9Uv7h+MXmV/T/7h/f/2s/eT11/Fvnv7x/Zf28/w3/u5qfon9f5ofxv7Z/mf7v+2n5v/JH/M8EfzT+I/5vqC/jn8q/wf5Xf4f93Pp1+x7Lrf/9b/1fUI9qvp/+3/uf5UelT/l/5D1c+yH+09wL+ef1//j/4bzqvCLoBf0T/Cf+j/a+65/Wf+7/Qf7D9wfb7+bf6D/2/6T4CP5p/bf+t/j/3071X71+z1+8bekDMLL+2fQT/5sK412uvzvzWvqrmKMHO3+ZTvJH3bnRG4uSMtlZaQNhCFZDamX9gzJDDfgzKypj/gppbwxtLA9uPQsc7npEhTVcR3YZ+w455FGp+ELj/5v/P5F3GAT83ccUJEX4IAONgul7qGBTHD+7QNs+TCIgEr05uEP8H0+Tjl5AtL1HtvC61H1xqCz8Fs7okaFOgblLqyysV+5mM8rr2AjQHt6y2nw2B6AM24/52Ny9Yjhc/JRpLqIdzsA2mWGLkVUAToeDpINlVgqXgzIttGyf93pS6jTd4ctu6N7Tbn8yxPTs+4etqvE8ovBCs9q3HtKN8X4zeCfa3ZTqTfWPmKh4GrdXj32Y3gB51A0Cw7HUZpAFcEVcvAOaW+Mp4WZs8G8kz9b5/B2Cg1a6HB9soXSafUKFHzW8aHwcjbvOJ+Ehj+vOeYMmfjskH4p4fexqn/hMXphm85ap8pmRsaBh64zppj2HX8/XYNUM1P/CL0lsAIj9A94ehL7lzkbHju3gz9Ws8A9KvnsEZIQShZz3u1Gd5rJQ5Zz4bfNY7q+UBUv3OgUI8nt/fZUjZgHXGyFWaOQZkaibnhX1Tz48deOmI/hg4wi3iMZdQxDfQiVOmuMxVglqigzgVivkdChpUfcCpC9TmESrR/Dwb60w226rhJ0KFrGgtVh/9Pu2zx8pA+kj0CptnIZPVRrlFuF0MS0oPCvSrKP+8WTvvcBIJryFoUJ3Ily0JEtTVsqIFiacVBLcwrIxLY0817TtHfOskpXByqAd/fVb5XgU3BSlWZVGYbxk1lO8Ygj53J5IdcxjDCgJqLHjlobVHb8v0CTHcM4OTcDr37mgaZrmE0cQcmBI+WfvDByB4UeADjKLmz+jVRcDxHNMJq6umP5zVnxOAI0lc8AWnj8yDUCuy1GtBF6qwznW8ny+tokOiqhFJDxdqGTe0RxEutyZesuWQWjvD7cDmkN53PTJ5RoaMJaDp2s20SJNzei+SW72eQryixWsU6gkA0n13htHjfSbr+7VpuSWEtgiRTY6n92vzM9OOFicpWWOVwcCgGVLOupQpE4wmKM2sWMejb/NgIdAm691VM2zNqt9O2C9fb1RJWlMQWkrdpwAFIElRCWyAhsvPQ0Qh5i5SbvMPZhMb53fBdt7J509IqEqxta+8t3nR4firHlU4rlhIxOIydeH/mxLk2H4PfXY1MtMd7FsGirExpUILsyuyo/SZy9cZNWG13+pqMBUNKU7B/jTceu+VH2QamPbS4w9CQculNE7G69yEACzAnMJX49lgrvpxwTJ5TdxwM+ZYNpdU4tZauCN8/d/nTqZVCuuAVjiJEDw9b97aVoeAHiNubGiMEKYHtn3TKNBjykNAGKU1p/TbY+KnDuvxCGZal0nqz+nHvpqWW+37soSFoeD6yCvA0gqbxl3UYDkpkLatOcoimC49XE0OcCT7noTbdA7jdj7IXe/CfQvnQxsm2SUlj9ninkZQUtGs1yi3pElKjLzjpsL6ZDgi9loSujSrs2GgPWrcregK3EKPLjzLb48mq6toEvoz6TsxsdGRbDRZOG0C/HXjx5bREwUgHn2Qd0NbhnqjO1euCvWKTYwnnY0/wm7KarRE46yuCCcCmreaZgor+Ilf/RvaWsf7YclRRqBCrBfhKBEVejUR60Lr0hUW+21fxeIExhptFnSxsIRVU1uLsqETgtK1p+pXDf76ltfflvt/x84f1hR+j1pTA4FYiAAP7vLIAkMYCzZldJCDfHIG+tHnWzQFV05ldAZnbJtZXss7JUyur0PyG7ybMBCGx+fZXx9MJvbyjUXR0r4QOYcl09Kw9USCZ4l0RzHP9iLxRQzqUGeU+le28XemipAmgq1rXn+ZjoJm4lemj5BTgVgAjFUDrOTNapbU/PkSv9+FFYkL/fBCvvY33OO4F2ZCsxhMOy4M0pywHKJe7x/Wd6UD3k9mob7j8mK87+aKIcpLkGbCqXQ17RpjHva10BNFaVj20+w9d42iYlOatT/StcUQt8vmkC1zCC2NnNn7ymu8YKiZwd+yX9D/vffaKBzdPXovTVFQwahqckfJzlFlvitkpQuO0oAGMHxb9+IjOZSjWFI5Mi9lPYwpUxg5Fx6FRifaeVMkqe/KR3pcpTBoRBrKxO7cXwJ2Bgz98a/FtRTPrq/Z9L7MteA+DIiWSaP/IdxdzfHCxwv5xJkhd8NqR1HSO3wRI7R7Q8yBGb0RqcmhZHLwetmW5UIAAC7SikUfKsue8DBQk8zNWfcdJAoEKTVmUb0p+ZYyke2ryKkCXM3VrOxb6Hb+k7bnI/Qh+62HfyBTp00iSa69UPNm7r8WPUZm5TOUfx3b9YzB7rpBHdcdi+CrQJMfMsIWwpurjmRSvZ9XjXYM9NjX5CO3s8REvaU/MUB4SjvSh7olACS8gInWPLcP5M+GLYGpbv4UcligzutvGI50Qcy8oOMfGfygYjjYo5Mo81f8JHFfw/ni54OX2Mb/cItYT5GKZqXkF5WzOzfhytYnI6xHOPUOCZxse7Y0n3Rq8OZnNhlBHe+6kmQoAA+mN03GuQlLxpW/0XXZchjbym37HDT4kJHW9P12+H5wfDZlRBlGSEArOvFrWPcyDJ5A6HhDd4R4aubcnSgJKqynb26Z/BOlMWg75C+mU7HM5wQLHF1NJf7PyPIv4Xfy+TwzUK0wRm3hflbdMDuI1avmoWXBSRtA7uM14LNWRPm+LX324rocaKYvI7zU9Ue4fFxZl+wMqlJqTOkMcpRQz2zLwkJAhY3oFSkA96PPJmaI1EVXYnj9yEiUr+5DQpPkMe75w7tNcI7w2exFbidy0UtAp/U3AvW0HB2o1TVt/4ay5inWU7tzyWgj78kXeS3TRMwqGTNtvOGqgjYniY1aTfq33YtBNKoiPJD/V0rVp5A6nGkE1csydP5jk3Bvtw3nov1eqEU0v9ga81MbhFITjiHXULSWWxpGcr0uj4z6L7pgfZIu7fnu3eY7dxbu5ERjjTiiOyrqkr/L0LRmcVwKjr0xhabvUGlcOioH6U76AYUb8nZXBqKbQXAN9OyNMWbGwXYuLMUsb670Cd4WBlcAovDQ7VpqdUQLFvcHGqhT9QLiRONHhczxBE4rt3+hTIJb4Yl0m8+l3vuJ66V/Jq+jmCWzsepwc+QUH/Y/cwF5C9nAdv1Dp4bozr0qxVFvDnHlPnauDvX/EOAUM1CeFHMBgDGksJSdGCgc0cyGFL+XblvwQ9vQd2gxouV1TBKVh3WkBghCssMCWlBBDOg+sFN2WGJLodu99BNLPW5MNzdpzG8Do6JnwtKi52kcrncISitULPG+gWQx9tA5DrNr04H8GDs2TVlRaMli8D/C2lbOxLkgvkDUReVju1F0JS+LS80LT8+dGNfgy2Z7GCUYhf816wxYTXVL/0eH9/CKWTYZOTgsXlVz+k65fBRATeDyadCLKnk75V7nFRxRvrSoR+2OrlB+K0vyQ7uRaJLM3HFo/sjAoqwbNKBhqZ9QnU0XPSDBGl5Byak+IDt9MZ+BeHN8gRiOEEbFZIaobeCMafa17/44EngId+IXHl2qI3cmfFtiU7DTglpqRAP47rhFRBCTcNP8k5/7pzznhmr6dIQ5quab7veynsJpbMk/1vsrCojBZE4otV9cPRR/JsUce/t4lbUEMMWbeRwMcjZV8fnrfIkUh/vUFm7DgT4PAmnYG2T0SELaGPqwNusRaet5AzK3d8IJ3wsCdjO5S5iRIP1bjA3ljvSARdnpjedZwIj7Ok89xIM+/jw0Zi3naJJZ8F1NBra/0XXX2iGlvEcRQhNY09IooqZlxXq/CJLOzi0V+7zHUrqiw8jjoAAxcvQm1gN0Iy97Tzc1aU5t3Ifi0XQgid/8sgHw/v1XXy6OPwHZR6GLTzrmZ+4eokA3v69FgZVJ8PlhdZW3dDDD0F8xDPkaVx08nkxBjqWJL5SSUmU6K2lZ9FKrq7J8REpYKV0qmQmoAqgqAG/ZXd6I/awyA0YLyBwVQ2G91q0zOuXFbCgXE8H9p6+YlMptLDyvjWXAIBrpk4IFxciBmiiwCid9l2WN9qkYXV4eB9U6P768V3MoCmrgyHcJPGaNFnx+mt7ctfLRDdm7LQTihW50ENcjh2k87ggTj/rw+deZDrMZwyP2fOlgDLPfz4yA542BOE69tXUm9DxDcqfWf+ovmW+8xuqQqjyNl/h3ukKJOkYi8QGgsvX9acD97xY28ZKZWqn3cRnb7rNmB9qG/SZ1+DbPmlw94rVpWGIuKADDrpW6N7MrteNNyTnFY/+q678rjrf2fbFrNgykDIvytIQvPd2BGkQwn9OZgoEPipitWWvh/UDgfvVzj7IjbNWgOMtHenfDnmVAt633pSC2eM1koPvy1KAHOGYfIwCjkVl1oxeEmbUNjdCsmTPTKGjS2HG9KVNGybnD094cqy39eP+OEmbl5HKaRuLP4VGdddC/xOfzNse+sugmJmjHSDzosJyRvWgsOOyRK+vBOLNmLpQoztPVsFesyWg+roCaRF4CY033uc/O+A7pIYHA9EBKSV6zooIPIwJSACmCp97TCUrDg4nITG4PIHUrS6B/xInVbsc+oOhhTv93K6kiUM0XzOw0cHFMyMfiqLpWsOQyUzKUBAMNr+3uStIqYteRQoBJuj+hV5exXTAWs1zcB8mwSKT3Kou2mIX5SjBay1Wd5KNjMw3QO/13MYNdo+GkWs5H8ntWf7FonfM7ryCfBIohkBaGSZDHHpshf9cRGE4VtY5jDVFE8E/HacS/lU8/8oDDGcqn3lSFwF1kBdDJOUw2bKcW4Ky+Q+HqiPuOkvfpf73lhOUc00mbG+eq/gQfmyosH6XbnN7sJGlkSsbYfqY+Inhv6zAIhm5a1SuiR2wyLS6VjKnep171XxhhMxqOrkyHpDsMbmM3NEtp1JlBWhB/Da6lFD6QmsgK9qK9NYsTYJhp1DDBbQpnyfOCIsUWRhrKS4OyN8d7L6aqfMiHkjwLOgd5misp/oR+xK5xepKw936bojDUvdWqAgeQIbKSebPOfyOQxQG40u3MKaPt+Xgt3+UUkbs0wMYx9SUPet8f+SFLpI2sX+9gvht74xeL52vc2hcaVFY7QtpisDcDuDeIL24t+2nC7Tcdwk+zXqDzgO9iViUowwlwByc5RLe3g2cEQXtLTK6f4qlRsR/wrOMLmSDBIpnS1dJaqedEHGaGap1+DT18/Gj0Sz/Z/rhOtF2pbcKqyv7Pn+VVanNx0XJE2CssQqJ5ngSBtuI1ALdmR3bVs8v6LsF5+tJa+HhGQ7KCJ3iIrZS/+j8PgVzz4y/hRpvj0x7eoCDGO23JaYxX4oulqNC4nSrL95l70b/+/G2fytAZ6Xbn7YP/yRSxbEMiIdLcr7Hf8q1Z92LjhOOHSOADY4+BtSvxSRspLEz1qvGNjwp8jUcH1rrBeC2kLUZEYtxjvI2yr2/lI4WoBsnx9hJU+buUWtHagaPcxHj31YCtGPrG16FqUxNvCDsonfnYD5F2Q67EzqFNHUsQ9s6EQxmLyEK4Coa5cHmORRtK0ZMaGOeplFb4H4OMyKIf6qw2bNh2xvpBIcIX3lk7PIdt6krx1UbGcxRpHdtEr1HSSOe0DIQGsl0CjTPKWJuyvHV5pRsYiffogW7yt1HqyKMN+IRJao7vToNLD4icUwwvNrpTfn3HWmK9xO2ujxeaagMYL6l7xKiM8gHhx6SLmApt1eZXl3Y2OHnDaV7OWPKw8JCycCoIED5BH01tobA7FnJKDB8ELzXdxCV6UYU+BtpYcwEsJmYa2bWuOaSczJYBxa5Rnh0c2dgcveXJ/r0fnZWVY+ExJLuBlp2n7r+FRCDsd4wiaVk8RFYE3yBINIRo0kt8IyepozYj1Ek2lX108IlTnBC1ExE33Kujfz03LD2zmX3CWrtVZpPnHdAK4iaOY8unpveaww9r6iLaHfLjQ8QrPylIuOzIxQd6rJqrs95g8tUQW29gc142HfELWNmD/8wptJrZGc8CrJHwjrHtnIxCfcGLoILgcmcxyXwqjIShe6xoR17dxGOpiXFnj2TLJKWKc9UFHqIjbT/gRgRv7aGbrkuWtbsX+yCbiIeTxYYBrI23hByY8tWcDCBbmhlazkIldO7DtTyF4NK3EVlgB0xjfoeiR2T8fs5tnqtIFMw8wz691kufDprzOWZ6Buq/U7xKeWcT/4HvgLC+EFvbptKdXQT4N9asfn8HCDDkfUZ2VwPI6wG0t/+lx7615D3h7XIPeuu1QcDqZA7sO6TLgDevdnj4lrlWVQbyJC1adjYOzRtF1UiC0cCrNE4qC1qwwwEsZzstUbU1ywC0yaIrJKa26ajXW1cpSWOPpXLG7d53ocMOulgGcWxEu8nA166HJ59eyWeofiC8ENXFKcFKHv50L3iPmjhjJNBmnQwXeXlNoF0w2X6RMVYWHLdI/mFBskxsdFlmhZkxT5w1GbS2zjPNyYklU8RmAD9nyMAr0G1K17KovCG6vXTyteQgWLPTdQ3trifDyyM/Yd7e156y3rFJa4y14zdCDr1MB/odevsp7Fz9pyf7V9Cel+CpbWYbn/FE5W/53wX8h66U4DjhHabX5WBnvvvKS0wkOdfkAvT3+++PFIX9K7TRj9PNIj1XKuIjKu7euixyDtO62ercfB84eIMMq+Em8NBWslkMWIpEUQYwtv6VQi1KBDUp1/LunRByHYNbL7507Oty+vKyGp8wiW58zVsM3ZyV0IqPJmab3MnxqCwa1VOhSALKiO3SEJLcsQGbC9/cszeMLZRALu/VH5m4vwvfO+YJf0D/lLSn3qsbykHqo5lAIvDQeP2lQsPYRYMpsu2hJwe5IIjyL3dxOSFbgQAnqP/T2WyFM+4hQV3QCDWX8UkN/E1M4q5qNQnBsuLFJue9w8JxG/VWhjZw0yV55Qrh/ENPg8H6EQu4D8k4wXH93oUl7uVGfUEda7MrwZkP5eFQpli2U6RN2JsEdH1dR/eLXsPBIZU0icfTSZBXKl9tq9HC9BOLLMxuRcwVd2QYaZLBZ9ykldysjkqoQ9VoBwwJv9MkCZbTHoaPZmZtw10YucFntvErEoj/2yLx7+IfudRX54AVnrNyj3YNEokTc1Fz032FDbbcgsscgIyHV1UPpixYRvAkx0U3GMFTdqzEIh9plQhz7GQ/oYCsvdFfMFHoUsM8I8qEvMahSGXNaylzqUs2QMg2vTfqUM4GVKDMuI/nUTL072zMikAMgumkoI+64rvQq41PHlEB0h15V4KDU3upysXMi8a6kfDoAVPwbO2ULySIU2Qemmc6Q/8gEw+TebXWEvXDXv9nRfpxIAAaa0E/oJFwkD+qAdXYKxfVq+ftMyR0jMkgmP3iVme+lgkK1zeyOP2YTRmw/+4m3JHWKH1Twu1VsXx9CFUVTzHvNaN1TF4c7QXqQAK97ikgxhdWm023NUVzdnsnHifeXNGSByqb1mqEsafPqQ5pH6OXu/xlfjjtYiDaLMgdcBoU2qdGd86mlZWVJ12vgy6uk57CIf1tB1q0aPEN/X62zbcySmgJ77Xxk4I+V2nmqaECYuPvQhNBOPl7GJyyCTa/QrSXeVQRgPPR/tqad3ZSr3dwkly2Y52nnDl4G7X48Q4AHJ20jrxguz3t9FEdqSn4RxubhPRWe7RJYtzIWzCggVYkCb8gE1tH/OBP2/ueJl2LkoOnOkdbLMF7jYeXFyUc2aH6bIpxWy0icd6O78TYfIWt28Un814tCpbulNqEBv1KI6LqzNH66j8xybroGFcFBxhuY98d/3W4a3GTgET9EXhpOV/bOFr2xW5t00AL7rXD60v5epiq7oYaGPwUOlxkzvkdqDcR3BExhfC9OirDcAKi6Y2mbynDP+ncZ7a9oOc+Ar4Q6NVpNDuVpqzSAxPYCSykQEGNFqTTRYPCiM37IN8q77EMblE0mdMdLZ+Ev181yDlR+XGXdatK/AKplTdXQmRxHaKzyX4EZ+vOsFp8FAeN3sTwwruZvysk0K4CoQBabkTjPXUONM/NQWEf1nH/AmTAiGTznT7OHNy3oVkEM3aJTacwBaH2aZUIDzPxO2nBCnPv8coBsGW2aS7Pu1dYcngDkTcu2+/rBkDyMmc+LB3CoD8r2LAJUeZlnY8fC4hmdJzk83bUXvP01FJNTor2L38OwIkg8hWdA8PmLF+ztQXe1EdD5tfLShdFcN0mxNesKmSCQjycJMew8lSalhzoB3hfb3/Tt07bAerhUCf2cmUgeihDfjB9kKL5eo5haogJL/eRXyuYRaJ+eofWyZr8R05EuCB8u9Q6Jx34fXkiQu9FcLIxrpCRFqvjsqbeCIGRRMWQ8CowFFSS5CbpFRpWhD9jA6sTFndYnIhYpIMHbMonqDvzMU9d2NJYMJKn+hkFAaOiFzjcP8s/5DFJFYrw8WLQbZ4NazwVnVlldsP3qvjBUVv6uZm8A4FqPG5rOhCKPLuYqw9+XfoRlHW0HuMcpNjxeh4SdU1YXZNJ1RS/B6bTkdA62PJPct9tvx5qlIk1TfdElqLblW+LStILOq0Aa/nfEE4O8zHA62kAws9wKmexaecHlA7yV/x3+DIZLLeiGa7hWl5/WXXWMqeSobV7P4xEX5j+dAC8mL7BovYYEK7QGN8q2jWCc/JFedB+J1VFrUR6iBRuTxnn+McLWRosZkykq2h/SR3+5hoUzlPVudB0FTUuJSjRRC3BGa7ITc1pxGBBbrMxNBrlQXTTI4TZN3krzbB9I/uT+ECVBz3JTPt2PFZIv6vv1HIwgDaXeSjMJpnbWtPeTePTL9WDCpPOV6KYEMCaXZaijdmnBkfuCB/pVNLMJWm4dlWtIToHCcWX07yRMDyw/dsF4EwKB8O4J0HQ/o4fMZdzuBpi3il+9UmUo/QB/tU1byMUeT7eMMXQ54Waav1SGWMZIyhtbPhpnm0nEZJAXyGNTzUVy2mFKou47jRTMJrbaXAcdLAqUJ0LchUWpYVLTKMaYKOcGdhskdGIrpwKNOm8XfN6VaHXDl9BnA09LEb/JirHLEf8bhsoKF/MfqvCviHZiADghfeKK4bNscJv+d0GIDWGpHqACizLMVXod3AaK43fbPwfSfLikXWIssisq47+RYHXS60kjl6peBQytAl7gR3XBJw/zRfuJLo8sv8uRr0RVzpk+JNJBSDHzOuRtItCe88QvuZyIuqAWRlSqFEN3w/y98AWRUh6wBcy0UN4zJ1yoWJZWxdoGsvz7tZCdvcESCu2Q3+W/v6vpKrNvIu+eFYzbXtgC5CjPQY+yYZRnktXSjLJpi0zEQSGkT0CODbdePjzPwmPsWV4dZT2LdcbO+HEJLo3/cfqqH6otAhkXw8JHIPq8APLAW8zjobJYhZgvAUxFE21unfxCei/d3gtwvZQQTnkZFK+Y71WzQ5aQL4yjDo2qTbo+heHLD3ZZ3lEgFfFZVmPZJQY8/LTsCpfrQDiquheBMa+kGmi8CulQxhTnhPB9quJBVu6/uPn0K5rdDlnij/pX5/XKTNMJdoXDV2lTilicsBZv0BsXftrcbY7qqHMAA2gT/MLzGcTvXgpCpAqFzSeScoPHsvwdVRul7EcT0i1UZaebQ/lYb2JzDlis+muC/JcvR6F+Ftzc9mEoi2Y1lwdIOU4OXTMEXWRbhJWBDALnQffNxT0rarM/aX1xby2B/QoilebcZjosu0zAzMfN52AcbLEDTwCif6W6Sc3iCVSSigZz1eXnpv01VIJesLBIg13nC760yuSp+Gc4EVSvM077/Wfzk0jWAaew5dbEajY4m+ZEjRxxy+XAkuMDF/dU5BMwkvj1984ae17+wK3cGmN1GkDiQUsh0AxARVgCmtutFHh6AtMQpOzXLCtldvxhNgZZrE0n/M9Hyy/PeESIwOidWnwz4cPfvOr3MCstJ2GE1zNt6EvR+UBaRE4aF9z40wi/suC/T+bB/q8Z2vscEn65RzSGuoPGL4QL9DIASKhQMMZ7/9tEKFmstu6Qn+xsUIZNYmZ5Zl4dVS6h5HnkV5WcdUmjbwrcNAtTRZVXyb7luMoatXfxStIxjf86iCfvF4A6VdpOxJWI3GnXTN/FsPDNEZZ38k7c92nLBVOVd5PurvRVLiCF279YRr6+aXdFdw5+BbCb5qdZaeWQ3HK04oZrNmek/OVWa2fLUpAEfMAg/5Z0fCkQzRThbW4yn2QUh7Jy/MNe0dfM6a2vo7E5sqgkmWAzs6kliBvuUdrO82t1osa14beyCpGL8mwams0RNpYHLWkqQaDgpqbsGZgJZBIvXMNDqhT/JIZRE6Z8xeHql48qUzonCvahRnL27HDO2uI9uH53LXMnQ63rcVRsTrXza6sP8jpesi+RrekSK/xvDsD8J0SMLi1lLd3UdJyie6SrAIhdBvPULK2tvYhVCe3uvjNsA8tUPIPiGGVHiOxo/0/t/aY7zKEUNYddH3gct2bdnLuOzDlMHf0fPNxfapR2wKdd6Xn4vOWygNbGuO/kv9hDWTWCN1TUq+d3D5Rnk/zl026NlO2BMTeS7CSjhnRbINX8MJiWZKgChlWVF3jA0XH6DBtXZV55t0LqseWh8C///Ew7KUOz7NK7vUSBCpmerbrQvFl3PsT1sDKkW9+b+giZPv+57axWv3hesbdgfskC3q0SRYOkNfDZ+uho0K4s42sX/uaFAfcv7Sh3s+A5f1pvGpBaXk2BsYF955/+LABbQrw19bM2nQ6QhvG0Mj1s6agl/LdU1x3ciW50veqEEabnPmCwz8w2nbnjPc6UOYinSMbfrjR/XXIIYGcxhr6+rn29jbpRgZeUvv7bb+/TuMvWL2d/TT4qMOjcL5547lrM7A2dNjM6tvULwP8GYjzjbjMTXJ8oDRgT4agrqBQa8uNJxn9IpxmyCz8zl+FtqvG9gB30otqh0duK3yln10gxjLzYe3oUp0zgVJQ7iSA20OMKpFvffOWFiUJ6yiEU1p+KD1pvOPS8S6pp4xejgRqyyf+fmBqiUEUCQZF+QtfG/8V07FOby35K//yhOXyjahtB/JM2QuWlHbGePYZnjwYLlOaWUgjaBtMUUjY5BU1vOGHgJuLwUtdufnjs3kKY16YsysK8QlkVrLo/xci8F6XfvZvbPo63h3qd5i7jKwx51WhKqTs/NAO2IUp+iPfSn6L9LrxOdiyfvtNVbrCaihZRxwvO0dJrxDohfZ2roAo3N/JysBwHyUS4BXEDbEYxm14eNAPcu14TzwN9qwG9Wey4EkOtD2BzXviC+aZeMpJU3bXTRsJoFIEYo5lEhf/xyTS/nHxADHwokiU7Qj0Nmh+4wAK558UC7Rx3je3+sXBhehtP9WO1jcB0VjTHSJHTWBMsXAjNcovt/m0gZkT9koKLMlQ2oXVakWv9eXvzsOw5U//lWkVEsTNDcozWTdqAZRA43Jl4ZLsRrVQ2occrLX2TYkTu44twdfPc4HNWIiSVsYGJotHWP3r+7CzOpOgCSAjoOxsO/VpounVrFVT1eAvfKNLslP6kf6102HsZpcQ5XgUGIYh5Ijstxhzf2zokq8LKHilOTi03G3aSXlbBk8wCmOXjpvSTpqx/pPo7eeCqS6YCTcEULde00eTuOLy4PM55Bgg/ntl/KAw2E/PtCu0nGyy6zoM7hIPLIQrq7hb9zXNLApi6l3558ubuXKUOc8zqPv4oTxGADCXJzRZ/v3+foqn46afi6BwOOndUib5nkDkddvYvLoimc1ua9CcinUmPbi2CrfHbH/RWNe5vo3UsXkgu7KH2A9JTmvCR7W4E1ss7mIn71rws4e2amDANXQiYROepnEiJfTHBC3+NhNC3feacYJrnJJ9KhZm3XzmKYTeK3IlfGjAYcMOFC7NPUv2svRyu4DG4WGDq2Iwx7lhvD0lFI9Y0W2+Wbfm0NmDcgO8NRoc/UKMqTIka/BNu4jP45LVLpTmif2upva60Gwn2m8y0NDU2pw9JYbMqsbbJLhNHeurEHhiqIK576/M+dT4ljH6x3hL1IML6Bj9YpXEYHepymRveNt6OqWpfJo7QF4ZPaQTfZAD5fFAfFPpMISmhASI0uEzCQkwej0CUF62bTFMqUPKilOD8ASB6tq89srFSX3JSueTCmM/rJYft20IfQrLEG1/F0JU3Y9Mnu7Hrqvi/yWPp9E7mPc2T1XaofL1HQqkHbpgb6GGuJ48avtxEWYSA2ClK/ij1GtcCZwR3R4TyZrWQ6uTJ0wDt9vnMuV87OFxwLbdim9tnJG31av6W1eNz7uryWjt5nT6nmRpEt/6oSOeTHAjYLKxZedr4dDi+HkUFawY8T/GbkFKlUCsWikFLHD7lL0Z/7Ji+/ZH/0IbvPGypjH9b8CDGLwg80lJ9nmFvgXO7e99bfBeIHFDP7Ewp95G8NZUN1IGMRL5AaGo12/MBp4wiIrJTfPDcleSqt5U9Uw1Io+Eylu7iMPxXm8OCZK7U36Ih0osfcX8fe9MjAHGdW29l74lVBRnyc4rxoBkRguhh0I6reWIVR9DUWPWuwJdNj699T8biRNTvoj3KXbnJovXJ7TT4i0TqMLc6yz86T7X5AJEUPGDC6o9b8vmp2MSSNh2/DArhDODBXLEs3h1cljhuqNHyI+nKQy5mnBTxUvBXlzbo9LMo3zTUo+J+4fWT2o9MhM3hmQIFsgMU7lZNACRXsrp9nY+vdhu48cnXvf+FTgt2eaHFrL9aVCYeB0MrTimjx5yGbwXAoYef1POepdNDNnatlIzf0iFiWQWRwSTtwxNylx3/iYZ3BWc7NITM7jurRz2u1zCgJlTB3RRfwXIKPgZ7tFZiN8o839LpvdJhc8LlaauUImBoLp2pw+XTlH3yvVoLJlYlEOd0pYSRDrNOnLmpmysfZa5GR7fuXHX+d0SltAZUwO/t8uDQuEd6tkpU1cJluvAfePI9ToKjz/uNY6upd/piwVD7igmG+34VtSmF2OTwUZF2k5Y+qAqVuZv8NcTxQ0T634rjce/HKR5B4VoLTdZg6rKizBpGdfSShdPdFVZwM4EaWxUy9XQrl94RDHXPd6kwhAI+F6unsicw2fMwHj/8nM3hfc5czg2uEukxlsEnkKQCvCT2fg1p4sa+f15kLVMp/tEwhCSou2Mw+Ctro2W0JjVm0mupgswREYhKcxTGFycr+OVPC8+P/HfKWzSun0BHVJUqzsdGwtxhULMa8SQD2KT/hOVJBxfy1NhoyoFqahtxsU41y1O6vPh7LlvmINjMDf4JBR79+7oNFVcrC19J2A06l4iS0tSokWU6Hb2ERdz0uYyoxM163wBajujz4SjNpz3lugCqXAPbZyDmY36GMltV3wYJHHIz37vMBJlAvjNmPfLF5OokEFxVm7tVHPwbk69t1NazbE/0ygDyu9rHSZFhqWP5NYnIB+owmTxBMHfYlntqmssh95+HwuNdFmqdv3j0jRrfb257hr8XQWuz5F18iioW/WoMsGMAOeVBoEkRQ1g+HfV4/+FhUCG00/B4+DfKwbdvyadgl2gVMITAOG8fWRTRS8U2vr96l+J61uPr/QUDUaS3HYfagef0rILrpAAHvu0N3tMsybm1mPujKmkbK8Sv3u1PpMQsTZKeJJeXKaNKlKkDlOG44DYGt7L7QdFfIBeKENyapT9kUdBBg7rILirtrt+k/QK7Bg6SQvnkBg5EcRWkSz2UnW407+M8gkR7qXtFwQ371wyXRHrAmcFHvmPFkzXWrP8Hs7zaIg373xGeCKMPMq53u0VKIr2E49ILhQoxQpQJMMka8Gk8KnRPuohTlS87kGfeYojJm7zS6mxjCDtr3WWvJmaKB6HpzzGXE0FOPHQkvMks9m6pdQ14eDO7pxPvBcY5JDi4xUTjT6jg4KruDabUDhxEboHIfI3m5bcAJIZu3Nf6v1wkqgiwSNF7MICptxyasb9f6avTgLUAqTJpNNikB+jMTmrzzU+q4Ur80Is3TiDQmqcYxiPfUEXXdAuUzwaIxA2oANvHuHPMWcjygND7L7Wtk5aLcm+B/G2QJA/R8bGCTXs6hJKVPRSx/SMF3S2D9D6FqKpHSbzwlbjCG/cjay2hlK0x2UhnrjejKTuvsclKeIS8IWhj4hLESkzbrPxe9h4hlOlbNDbiXWgvkowI2/STRsdgjJHYD2BOyfqwBW8YjisvWbPeL9/ohSJ8ZnD+W/8x4neOmtHEaNVkC+RKwSfFXsC/6rJqfGtwjLictH3Dj42XyQjzv9/ZYLivXGvm4BNmQalveWwQpZjO4oYA/uUGdSfBZlsShxCNXw3VS17AKWMJ10pKfBSS4jiScrvCfB2YdcxeKF19F3sKpWOm/B4yZvmrKVVtyCTiHQ3dbVdEiy1rIPLdgJgRx88BhGAj2sl+81BL5o7+HH35ugs1UBtv4k9dwxfM5KpnHiZpEgOHbT3ZuNmOczhfZeGN88er9zZIsl2qse+hxedN/vbYCkCp/O6xezv47LUM8K2olF5XdWE5qdpxGtwu7RFX+JF2Du4XXOkOfWXwVP6cCKQCj2IqM8AfsqHCCo0Ljyiui7LryKubQr+7/TtNzt4387PRRaJp4AtSRbFeFN2i+JG6lUm+2BijU7Dq7IEXffdNKJuAtGzwRehXzQeGdsfDTQlJtlPNfYmV4tlGvBTUTgXtwu5b4yx0O/bs2FZrztXMTiVxxraFgsTidj+q2+TwqCZuFOAK2ckARP69C+vb3yvaqntKLAXb4GWyyR+jZuK08YFMefnI7KWL5+UVItQorlq5I41d5QMJUWzqigCWXK+nlgRYEcdkhptlUxmAfMU/U+xtdV64zg2aDr6OF5Klubh1jmman6j5SpMmqE9gt5gbo2gzFn3ubSXazhHuH5C7UXvsiOCsinPY4MkluUyO2rXKk/oTVusxVCIoisA7lXNCYEyelLtONGXP6d6xAf77g4y8VzJkFhJYrxwQYL8DUPJgkgKQOub7Wj1hU0lK0mCFQSjPd6N2QNHWcrGH+cXVPVcTVzCNyQZVHuMb4h5+6noxwuYvzIUMYhdwobptkLknKsrsgA35zhwnux0UhxHk2ZfbfCu2W67AFPmuD/X+w+wbVBi90NVrw1MgiYo4fIE5FEqeFHXXJNiV1/QxUdBGqHgILqSmz5UfrE6rNTblQONqzzikf4P32JblSbjjj4pKAGTnkK/Psdo90qwv9epCEEoPjwU6WTOhDr8Wjhf1ejhcUK8Xk2dM1LjFqEgXD7cs4ao+WRevG9jgzWRxnfouT1kdldeK91DGkbhUr58QRjq4TkjE4eVPwFyjpU8HtaVUtff9Ruc6J98F0bipZ+Yf3ja0kI3j7UeSP9DmYmf06WR22UGF1IG6iIoK8bkmyji9eNICi4mxoSzbhQWSGvrPIGTUpl78/Qx4WsPz3+9Izc2/14y9+O5frK/UDZKAfolhEnsMh6TU77trbLKkytyb2/E7zg92vlpd+la3NZHXZCjTw0Pk7/5ewRBv0o4XHV6fSCY1JdjY9w2+o0dzAobRK1dcpKTDwi9lwUZtLSkza1LqU7RqIMla+r0tFvb/0mrXQiFIMuVbsoZRmUS2Jx5aOdVvv0q77UWVcRDHyWw1djlwVvhG3pXFHwuZXdxkaxMKhaU3wDzYtGJBsN9dn1+LIy29U2iUuZ51H9ywU/I0fGI2gcUbG3w0uswPQgL/XmXr0HlSxg/A+/fm621G4Q5K2Pl8Sa4ZyTUrfUZfzKG29i0jwChfnhu1T1Er48DZg4/RukyjaCyoJG+e11wEx+HAKfcc7i0vvRJuTM7kjwxYiY30U6ZttA0SAqmWO1AIEbUBKG4xgIKFyOOsOmQnUsgH+xM70d+wxpU3oKVn5K+OVB9h8G+fiDAi+tm29BPYDNpoC+kH4gm8wRk/uFYwbJTmLDHNonhPxlbSamBpi5/oazNsv83gekIDaAXAcrYYBUERSKVttVCpUT00LL9rTpvaqEuwOPj1yiEx4gr3hECm1KtOXys/slx5s6C4AYfWFgZts5DO+1oiGtLza4efqRsZvZLiY4ihFk5D8Zptl1sIXqBwSxHIJ1bmv+MLBAx+OiI454btJ20po5qQ3rVxveFWQHCeQq4wfc10RbgRZbKsvImFzx+uKgF+Nvyt24nU1SgCH115e+tbD9YX5zIhUP3woBN1kS1XB3wM/A6sUOTRAImdiJssd4cZtj8cGhICoAqChnPU5868EIHqB7Ni5J/WmE6KZ1t327ZfBPi1BazRco21mPhyGa6/tdP9uXpxQKy2ssr0RO3V2fnYfJBIz2NwxFULiCuqSQYY0+7Pn4BW8H3tbKaPQ4SnDzHSM2Ujgk8m+rL3RMPfhkJ4/Va6z9P0wi9ZGf3zDhVCz2CDJCSQThKdN63VypmprPvj8OC4HZMeOKmT6G9xPdNdh+POy96onWI17m5gpTnn9tz45D2de4tvLQsKtYnX/UE4uFu6NUMfBaLnxqXtfRXkyKqYIxb1EKv+ioC8gE3VapifzaYFUO0gMAavN6ErpY/tEtIxb1BRMxhdkzTSKnPrSxa6ndzYRSsbE682yW/8QG/gcrSPuOMQQEUuakGPl1piBirC7NXwyMU8+RdP66mvC17IoZ+61ImKBZFXHGTKehU+RPf2KO8/lDua5cKgaQK+e6mlt9zPbVRL6ILnXfnUClP0oUFW+jWAR/V/SfWkN7l9O2//M4DhnDJb2P7S4phjT1kL5v0mi3RHetlQwo9sbD5hiswL/GL7BpVLYgDl6lGbVeNkPRNTVkzR67ErK8xoGNPFgJNFdd0HASMA+vLbuz5Atl3SQYApYaEYZFtYo0tI/u6wQ3F9X1DSzNypWhprJXFS6GegXB0hMpGZYiYqPZJ/r2CLjhmXdM2bV25JFC7UyiKUqebuyHGXuN72/D9QeIOmEOOlCT5tTzjN2lPK/P96nj8yc2/9OIoMstJds8UTawYeA0UwGba5RbGJqcLlMzlvT9xxq9wnKvX+TpT6U3pAKASrjcZioqP546j/B61qTe/RkGjCO6W4SRUU4fgm6GzbDPxBYVV52DhCl+bRJpG2pvRx63g5fO4TB8CQydi/C0MnW8MnRJe4yaU0cekcR+J85jEAunTn+xsaxFdqQyoFSiLZ+D2T/GgzhX8t045BJTSo4hqYZYiHdnwrDl8Qpi/906hTzMzxDRx3llr+blSNQX+1qzThX8PA7EOcqcrNWu1vWC8gdjwTsk1L+reNW0QohAnE96svkOKCPj1myweEh273/az8N165qvfdMDoahVdRc65AQg0cg5n+D7tgk8aqYK4CxBR7ptDJcQAeSUIxTpA4/cxGqmjnhLj2kdbQxfmMRVZ5zW5DDlQK9kC2GZfBRdMx3QaMKuIW4fkw70/Vlz2zBQOFW4LSFKmSz6qMtgNwOQGTHu2tgusjIUy4z82+ffnAFMRu1iYX5pXY+bbNrzAncaBaQItrb8aLvYAt5bZl8zvDoe+hPKfYq7nZjL69bemsFGVxP0IkRD1e7GzuPuh3/p4I0cPSWCopOQe47K7ySNTdt/wXBt6jxxTPPdl44BnvUYQyLJhlk66IYs9xCHUSj4adxc0an6o2oCqrj4GLFQUw9PLsK5DcU/DQbihHAjAF4cnYHfRdLvfkQz5Zuf+Gxmuertm/pkLGZd55YwGWGz8ei9NoR8J8lTtemqVeuUtbOd/2b0bVeDszXpeHnK4dxfWRyvfpDk37KO5a86ZjPT+g//Ax8uFWjlyIZsxGbd1EZ92Izhua1c1V7ok9c1jPxEGICr3xp/8HieFWRJpIyIByXmiPUiLKYjljzyV5jByFsXWbpTH9YzxmCtafyk+xbUypz+mW2f32ZsWV+P+7gWJaOAH4Lc1Fh8976afaKlYzJy7kg24aD1sfrn+do1qu4E2rT90welNcIzAYYd4M0F2MRFkfLShFlbzB/S3Uy20S81xBAsXHhA444SnToxJxILpE8xT+yvykU5uEpl2J7kGmtvTLbsxeCBCW/Q+9I5Mb0EzP1puVgY/APSgChrcIPLVaZQ5OPRCBs18z8ntJZRdb48YBhmacq/Bp6zU9YSzTGBHGN/v9WWcXTkwTiAOVHf+3SywfbimDsHD9pSGS8ywf6rrkiwdbNdjHC9PDe2ALXGJBnKfAJAFQmsunkc9O8X/ySw2N6csHoqUbqidx/BwbmGL8+Nd108YnLf+E5y8nEB7YCDjkVROjVWx1gdYafPqhBDSuPFBrOnPw/8xCR8x5h3S+SfO3iufvWxDcoMgas18oHdQXxBE8QnMHIzkdq1SDKER2myskPnv8rkV4r1nWkVou2NuQJBkusG32Trgcbir/WVvP26eMhV+AJ04Z0MAK/DRaZk+M0dlHIa8ZmxnT9+ofcdRMlauYjBdNbkIKT480M9oWvW0Hz/C55LGQHDxr5cr9GZCfMXBLaWmLOvbDWYVjjFsfsvjL/41rFPWBdvVZWWEgBaiJLAFenSRUwN1p5BomIdSVmeFELebvCt1s5NuA0sxTVvY5q08XChuIWjF8s6blRR9RmkoJdiLEMNmT8ccYy6hTz4a+bSN7+3PA84p2j67ybuOXZZW7xSK0MLKzEcgheqoeWL95q+yZSOPNW0StVXs0AMe1wJOe7y8A2/TEc2mGLnf4wm13fOe6GCLg4cIX3+/W9qtxlvF1aAHrz9nhz5iL0wGXVggY5Jm2rPZ+MGBfhgAzY6RmX75lGUJNzhdghTaZaysL+NYoeM/nj5zruT4+azi70hz5zoZfQLss97n/26xxvrzloDPduMn1HZauihB2Ie9iwKSEjkollb+rwglgYY1705LMab+xeb/OAxKnWXEGl75GbyMSBm9dfTbb6aIO4IzyMu7uENsrP2RWIoOuFF9DXfxOWBGHuwHdu8UKJFjP03nVHYQbhhIAZJt33x4IK6pTiOJGNzcymtqnACSm4zhoNM9XZeSFYjsdfHlGGVKqY1qUVN/3otJgBA9MkhA5C4EGJV3HKURWIfIa9jSxMTfU3C8y0fJmntY3bTy9pD7apcMatogKOz2FUqtZPWLDjhg6XRhxBf74/sTX7sUft+p2DgN2IuTDZH/5ACLKsPSwO1cJJHQl+AGFgUf7IyygGolY9G/ABRvszRQOSALJm+MNrfcU1AFqZQAwTcvtSUevMXW0gbUhXUcKzf02M0LnEjxNu1gJGrbax0r1dcxbSsBxCvktjYfVcZeS+9diiR4r900Vsxo4WWlhl8L+jVH8BRtAOmt7o/n7DgSQtBCcpa+Cf5NjxmwUBNEYXRtm6AebtqA9afVW7hFHPwmIGRtXt+JbkcvUs84vpB2GzZhJxQ65vOhek6RT52s+UniqdSOO9i0cMWa9agi3RcgUhlnL+n8KSv2oZm7X7AchJcVcXJjzsdW+A4Km9Gb6sZyIpWBEvBUw53pFTM2Zrdld6QjiGRmMB3XeZXuboFZo1QLP0VYijVtP9ETn2ku/jA+Ih0jcORrSCuoYaQX95FGZ5ciVfaVFShCbD2Vmc7tBmEaUQko7dDoIMXrNcNdDk8kO7pfSR9PmURGuBSDy5EyGvQd0q3qkC0g23UAzBnJArkTFzOCE0ua4fz09zWYlbf9Og3iXuqMB7gxjl4Ea/t/9UJwER1rXz2Jf7H9TS3FXxHENrk84zX/0J8gAXxU3RNfhYOhcS/N0lERZvex9Drcg/O0gpA5mvXfSEagV4sCcaEK0taSLW/GW4fFRhw5vUAkSiXwqjH57EVKeA6+ElIYf/MFF5yLRI4PN1C276M4VAFxE1YX1YFa5FFwACL1ONSYkUYw8rVeQw13IF+AIXONudi/CWCfKJEzGIB2nAm2tU8ZSkeNKMiGvBgyZJrhO+IV3hh1bAlbsI93ixS06CYSApz0Nd57mHKa/fJvsq7yf6CINpJ/ljWyppCrECPJ7+q91hjOyejha5E2Nksij4H9mR3hHYNpUTECtYn1H6FVndI0/YMN44yZRodFOUBfvOfaEuSyM5goQg3CvxX5Fyj/CGiPlzxv2+DFVPyamqmktPHXxtRy7ZrgiDnjIuSTt2rFbXSk12M9nW6Avnp6o24WWt9vBztFM2xVSgRHV6GmyvAZhSLRwOYWepp6FfFYpNlogE5lAcPc34Cm+Kj6M8svOmDrqWoq9IA1ygX8hjpmlkW+SqtBv3IFLc/Gon+iA43T1pB7LeA1sYAQUvV70V9Tv+tw3Adl0IFkwXbxBGDRU5nuasQYLNiBWXFDYrDRNEOEeSheQMuxwnT0h+zE0c1XJBTK90lc7O3cWCZRzHCqHO4sxhk1IrWYz6a9XQtxCW4UWwsAXKOhEMVz4Q9on0luzRplc340b2kF5XuXp9fiVDabZt3RqUTt3tPO0DuFzWQMfI2G92MaprIYwA4vh3LzoPYG5609na0xniU2wzXXivaCSG6KEK+x2zuPf0cQjXJS3eeeXm3ans5jK4LgbIjhuRwDLeE1VBOHvZRjUJ1035dzS0P6UoxP5k1kNu2khxYtmsIpYE74QydfHuUVKi3UlclD+SLOShBcNGSbXfeu4tLmH9naq81OjqVdkcxqPkWGfPnPHCuKMo9wOboHOQ8IXICZdpaJsE/FV9U11gdoixfWrnjguwx+/Xj9ZqMFIM15JRcMMgQ+7UbLGoz0Pb7f7sFytRY/vX/BM8+zSb7NgTWOhaTYexCeYQBtrTkAf7LpUxPAST3KMes30ydYrzwR3Rih6UxsjuAkdvNo/SMFfBphjqfRkkXkd9ol4e4xTWxTN+U7qjWUfKb6huUMAeMOmcPMCRZQGhGynnZ8Tzkl5+tTLKPgef1Ie2rQcI28eqXPmCBMtCyfwnQaJOuPLsKuVz2VtyLVJu4bBbA3tzYd8FwaxjfywKnK0p7UDX5UHx95Wu6NvOPyceJ9S9oB8YSL6iKe0u4hc+4CMOqkySW8QgO5c/yGjlJYybsxNk1f1A8GpqpDhVzsMUlVqXeAD5ceEEV9bi5+tENvAB1aG+J+pTu7mSslllX1/CG1ID2nfj6jNjvsDOUDVZIq9g1k/lIUOw3VtF1BC78tZ5vfGQEMNPRZ/YVpj07Xj4u8AZM8pYUu0352ZPLr8feTInR5AWNS10lvxafZ0wAusOsEOSYcu3LfK4s0QAx9RY0HwzHij4m32vbB0cQm04frj0If7GMNoEkhd6opR/iEMdCFtbp0u+GGfH8t5CFDiX+vOEplYhAKAA998O3rjy29e+MuXuMrtzhir32TODiRufeqToc1ZlPcYOCuXTct0TTs+quALbFyhbtR4f/qeFEixn0pj10ic1hAGf/zDsEivKsE9EsrTfe/GO9p1IttO8okTLmOaPxbs1DlncnOEE2T553lEfHlMv53fd8ts/2e4EeWC5Cuo9kJ3m+TDll04kDF1VWC/MfeJ4ZfcapQLF4ukJr2RSaAxA9rG/FI/ehOipoNiGAQfvmzALpNu0s1VAsAZWVDfJkOnPOzWM802B3OFbGlPc/wAhMVwh35hJeNNKHw0IyICDOMWqnHGpwFIWaYdp3Lx+/B2hoE9Hw3UzloLaW5RRWYVV93b7h460OPkumygS3hdvRXeBOCT3lqjcMDK7WAiG4nbWDybxP8I0Hgbilp9157Bl6Rr7w3w+Gy/itbdfVKef7qoh2TgCGmkhHtlnYHNhMBeH/PZ2LMUVpC4cc7PToCM8+ZRr9JGKmQW9fUJ9Rmi2ARMN9+huxUNKNN1brorTxv1PJOPj7/Gz+NsGKeUgwvjWMMdDvfhybT2C4cEmGWo+Zu49M7TTiKt/BysCmy1KMJpK7ENGv6dbOQ/r7KMjJc0WNjd4tVnOzDQb4GGLcJUI79DN6XkWVX4LxPvFiGDZfe5vKb7zoD3kQ2+kzjAo546t2C3NFzo7Vcst5FxCxDwb4PA7lOITs9Q0tsgk9N2Wx1WutKftl9QMhFFXQ43NiZPMXKccDh0EvNC1yTAoYNHcDiWThuw9uh7Bfofs2SSjpi0S4Hiv+o5e7YyaeD653/BfE/9fgyGhL5C6oJUPGDd5fionvxrCtQ3vku8qetENu5B6anFVYeHusx7NkvUbnI8Caoqze+6yQvECs73ufTzaLUM0WZn+FvudKTXRnR3GtbuFRqSfnBnNrbqf440RqknS+2BQ8/Wniadigx3xCwDczZXR4zAabGoD6JcVxKjWx7qRlJKS4ZyV676SXcw1+iiYBO/1HddxJrztXhnjD8Snoife/ESyIvd5XMrm0R5nTJuYJGLEKqF4t7MXj4y/fe7qR+mgqTUv2Vcq9zReFo8+7nBV9OGQlNcj0rybIMbI6fy30c2kpbO0ABFWFRsO6miDaWBiWN6rVArbCkVo3o7Vm2pJVN/oHDiE8u90w3A8KwBG1Qpvc/+63/8IylXJvSD+5anVdIlgYOd++94ph8lsJrc+LiGrGcD4UDcliu50Hc3K1HZSKOgheSc4DpRjJ1/2G2Sx9golk9+b4ro8UykwoVF6CmNKuk4P0hGfOMIEj1yPzsVWrjvJbPejK7iaOHyDfLgGzIqe9LlAbZXiJAgivRUaImwNagWir8ahv5s7h2tHZQQYwDf/nguht8tjkWZOdOS2ZHvO6eA9zsdqY9cv1yXuL1/t+HfvKeuU5GuY4462r45yCibBWo23S7XUVZ1vqhuJEPt3nv7y8vBmcnv/YvP1GnB80yCBFkTnF32KrP8iQ3YM9IpPy3ZSfkDb45ofB2xII2B95jGEg/9G210AE5J8Fx1TEgdXXZSmBSLmVZs8hpwxCpoPXtEhgWynxrhCSXuJap97hPzCtP0NQeG+gAAC7/hS3VK5lwvAjOeadlmh4e13vd5EG2DwJI6zBavdkjTrQ1cxEe9hDitiZoqZybXe5ORJGYSH+WNutUgstm6vncqXXRFvI/mFO8ZdLES1eNG4MDz9ZWByZNv4QthxqQl+CZAHOnyD1ERfMc72NKD0tU4Zazd3aw5hnE5cvCJR6BYG0Ng+KGi2B/wEPk7ptualtaFPp/YO8DVPOM8qSp2yKH0AZk12IaDWIAX3DuYYAMRmoNfHKeAk6i9HS06b3wwwTruwxPYhgtrdUdFCBjRwF1V57SqbO5kdtXvzKIYjG4R8Fr7/t9rNenm07JB0GEMqRfReot0nXxLTyCeiOcv/V+6FKEiYeVUn+7iql9J6ZdGvONoXCt9WChWVwkcs+EXqyAe7PmzI5BXZ9NwxlqQNeq8odFzdx7oWvp29jxb8olKmpNHa9I6KLztgc0m2MGDH/aqRPp0O8MPf7JjDMf0hpJvaqJAkiIUNP4yg1LI32HGKOKdKdQ4UApoqfqokGim4B3Bn8LqHwq0m4Icmpdmlf4rqw2hRCDsfhhXiQ3tbQ5VUG/PpsDKWwy7CGIIX6ItIzYy6c1Ftceffcmi5XzTjM+UDU+P1BMpS79OR9GdTjDOXFD9GqXErfiIhDIw0pzyqTgirm/w9wjGuGYIdf5VtqS6aZcztMT6Ix5A1iYS8lGK45pJxnbVwTQQ6vUAJ3GRaUWAcrd5/Nw3vPNU6Mi3gD9ldEk3tdF8AxFMJ18+yGD2gSLQ5b4k5e1klImjI61Ta8F/UfedDoRj/0H0DbmcZGGan8VoxgrXTbtYwDPCfka4h58hjByvPQPw3kvH+qgq/hxpm9Cj2pKmApHK4yNl8MmScisQCMxJ4Voa9Sog/XLfKpWiK902nRgK+RIe5MaEDhJNpaCCK+PXxW/fYq+AZjKd/d2+fQAAAAFUJHMy7bXr/NW1Ale/0tY1wewB/6HSgF1NDZvtj6tqxzB44OauD6UXImt0pIZ1tlShuspQoGwUmVqdn50mHPvtR1Xs0JebAAAc8DFN/iLhi1b2/p0/EI2IyrGfMlTmNp9VGnsc8FWALfCzcdjcKvVm8wRbxUA7YLmp4clp/BwjDrQfVf4K2ijRGNujzRH3FzsOy/p6qFJjTgJAYZ3IhXzXa99Ny79Zo0KxxYltI83RbSAczrMQAITzKtyAGKtSnB+wNgiO2kU0lKrpnweLlAAB8O0fcYE21YgfFCwzz1iSGsEyQbyM+54S6tX5O6Ak5VGNlhtOg7jStnQanl2i9+iqclGqJt9H6OxVYswQLiFvHXSH3aEKTm18ANGklYRwGT2vNZLtOZG4i9NyjkeSzu+Iogc40Pc/FYYo01IEwiH6q9kV5/jvVoEpYNlMdvHK96yRBrUKVNbBHm1OFZYhtLYalUw/A9jxYq/AJlh6dYGA5Ylwstv0jKxgiv79PgHfu5SxgJvrXOzNTVwpvvrYRumqom3LzH1DUG9ZoakoOtK5WPm/I1x/bS4jxEi0yI0FTJqwAyqZ06cCZqSW6FCa5v1prXF6PJxM1bn+hN1hyIIk3AJtzZ2j/nkadWF9+SxPAAJzfBcrQAAAAAA==',
      official: 'data:image/webp;base64,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',
      bilibili: 'data:image/webp;base64,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',
    }

    return {
      inject: ['slots', 'remote', 'remote.session'],
      apply(ctx) {
        const remote = ctx.remote
        const batch = createTranslationQueue()
        ctx.effect?.(() => batch.dispose)
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: 'pdf-translate', order: 26, label: 'PDF 文献翻译' }, PanelIcon))
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'pdf-translate' }, () => h(TranslationPanel, { remote, batch })))
      },
    }
  },
})
