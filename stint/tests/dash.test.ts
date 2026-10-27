import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Board } from '../types'
import { BASE_WINDOW, DASH_MODES, FLASH_MS, LINE_MAX, PIT_DONE_TOAST, PIT_WAIT_MS, REDLINE_MESSAGE, TOAST_MS, bar, buildRuns, canToast, cols, fit, flashing, fuelOf, modeOf, pickBoard, pitDoneText, renderLine, thresholdsOf, toastText, windowTag, zoneOf } from '../hooks/dash.ts'
import { assemble, parseFork, parseForkBody, stintOf } from '../hooks/pit.ts'

// ---------- pure functions ----------

test('thresholdsOf: 80k and 120k, capped by 40% and 60% of a window under 200k', () => {
  expect(thresholdsOf(200_000)).toEqual({ soft: 80_000, hard: 120_000 })
  expect(thresholdsOf(1_000_000)).toEqual({ soft: 80_000, hard: 120_000 })
  expect(thresholdsOf(100_000)).toEqual({ soft: 40_000, hard: 60_000 })
})

test('zoneOf: two steps on absolute tokens, soft 80k and hard 120k at 200k', () => {
  expect([0, 79_999, 80_000, 119_999, 120_000, 200_000].map(t => zoneOf(t, 200_000))).toEqual([0, 0, 1, 1, 2, 2])
  // a 1M window: the same tokens, a far smaller share
  expect([70_000, 80_000, 119_000, 120_000].map(t => zoneOf(t, 1_000_000))).toEqual([0, 1, 1, 2])
  // a small window: the percentages cap
  expect([39_999, 40_000, 59_999, 60_000].map(t => zoneOf(t, 100_000))).toEqual([0, 1, 1, 2])
})

test('windowTag: nothing at 200k, the size otherwise', () => {
  expect(windowTag(BASE_WINDOW)).toBe('')
  expect(windowTag(1_000_000)).toBe('/1M')
  expect(windowTag(1_500_000)).toBe('/1.5M')
  expect(windowTag(128_000)).toBe('/128k')
})

test('bar: ten cells, one per 10% earned, clamped', () => {
  expect(bar(0, true)).toBe('▯▯▯▯▯▯▯▯▯▯')
  expect(bar(22, true)).toBe('▮▮▯▯▯▯▯▯▯▯')
  expect(bar(99, true)).toBe('▮▮▮▮▮▮▮▮▮▯')
  expect(bar(100, true)).toBe('▮▮▮▮▮▮▮▮▮▮')
  expect(bar(140, true)).toBe('▮▮▮▮▮▮▮▮▮▮')
  expect(bar(-5, true)).toBe('▯▯▯▯▯▯▯▯▯▯')
  expect(bar(45, false)).toBe('####......')
})

test('fuelOf: the tighter plan window, as what is left; none when the host gives no rate limits', () => {
  expect(fuelOf([])).toBeNull()
  expect(fuelOf([{ kind: 'five_hour', percentUsed: 28 }])).toBe(72)
  expect(fuelOf([{ kind: 'five_hour', percentUsed: 28 }, { kind: 'seven_day', percentUsed: 61.5 }])).toBe(39)
  expect(fuelOf([{ kind: 'seven_day', percentUsed: 10 }, { kind: 'five_hour', percentUsed: 40 }])).toBe(60)
  // a plan window beats a gateway's spend limit; the spend limit stands alone otherwise
  expect(fuelOf([{ kind: 'five_hour', percentUsed: 10 }, { kind: 'spend_limit', percentUsed: 90 }])).toBe(90)
  expect(fuelOf([{ kind: 'spend_limit', percentUsed: 90 }])).toBe(10)
  expect(fuelOf([{ kind: 'spend_limit', percentUsed: 130 }])).toBe(0)
})

test('pickBoard: alert > redline > warn > info; an expired message is gone', () => {
  const r = (level: 'info' | 'warn' | 'alert', until?: number) => ({ text: `${level} msg`, level, from: 't', until })
  expect(pickBoard(undefined, 0, false)).toBeNull()
  expect(pickBoard(undefined, 0, true)).toEqual({ text: REDLINE_MESSAGE, rank: 'redline' })
  expect(pickBoard(r('info'), 0, false)?.text).toBe('info msg')
  expect(pickBoard(r('warn'), 0, true)?.text).toBe(REDLINE_MESSAGE)
  expect(pickBoard(r('info'), 0, true)?.text).toBe(REDLINE_MESSAGE)
  expect(pickBoard(r('alert'), 0, true)?.text).toBe('alert msg')
  expect(pickBoard(r('warn', 1_000), 999, false)?.text).toBe('warn msg')
  expect(pickBoard(r('warn', 1_000), 1_000, false)).toBeNull()
  expect(pickBoard(r('warn', 1_000), 1_000, true)?.text).toBe(REDLINE_MESSAGE)
  expect(pickBoard({ text: '  ', level: 'alert', from: 't' }, 0, false)).toBeNull()
})

test('fit and cols: emoji count two columns, the variation selector none, truncation adds a mark', () => {
  expect(cols('ab')).toBe(2)
  expect(cols('🚀')).toBe(2)
  expect(cols('⛽')).toBe(2)
  expect(fit('short', 10, true)).toBe('short')
  expect(fit('a very long board message', 10, true)).toBe('a very lo…')
  expect(fit('a very long board message', 10, false)).toBe('a very ...')
})

// a reading at `percent` of `window`; tokens follow
const R = (percent: number, rateLimits: { kind: string; percentUsed: number }[] = [], window = 200_000) => ({ percent, tokens: Math.round((percent / 100) * window), window, rateLimits })
const FULL = { emoji: true }
const ASCII = { emoji: false }

test('renderLine: zone emoji, bar, board; no fuel, no stint, no cost in the ambient line', () => {
  expect(renderLine({ reading: R(22), lap: 1, message: null }, FULL)).toBe('🚀 revs 22% ▮▮▯▯▯▯▯▯▯▯ · 📋 —')
  expect(renderLine({ reading: R(48), lap: 1, message: { text: '3 decisions since pit', rank: 'info' } }, FULL)).toBe('🔥 revs 48% ▮▮▮▮▯▯▯▯▯▯ · 📋 3 decisions since pit')
  expect(renderLine({ reading: R(85), lap: 1, message: { text: REDLINE_MESSAGE, rank: 'redline' } }, FULL)).toBe('🚨 revs 85% ▮▮▮▮▮▮▮▮▯▯ · 📋 box this lap: /pit')
  expect(renderLine({ reading: R(10, [{ kind: 'five_hour', percentUsed: 1 }]), lap: 1, message: null }, FULL)).not.toContain('$')
})

test('renderLine: the window size follows the percentage when it is not 200k', () => {
  expect(renderLine({ reading: R(29, [], 1_000_000), lap: 1, message: null }, FULL)).toBe('🚨 revs 29%/1M ▮▮▯▯▯▯▯▯▯▯ · 📋 —')
  expect(renderLine({ reading: R(5, [], 1_000_000), lap: 1, message: null }, ASCII)).toBe('revs 5%/1M .......... | board -')
})

test('renderLine: fuel only below 30%, stint only from 2', () => {
  const at = (used: number, lap: number) => renderLine({ reading: R(10, [{ kind: 'five_hour', percentUsed: used }]), lap, message: null }, FULL)
  expect(at(69, 1)).not.toContain('⛽')
  expect(at(70, 1)).not.toContain('⛽')
  expect(at(71, 1)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · ⛽ 29% · 📋 —')
  expect(at(99, 1)).toContain('⛽ 1%')
  expect(at(0, 1)).not.toContain('🏁')
  expect(at(0, 2)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · 🏁 2 · 📋 —')
  expect(at(80, 3)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · ⛽ 20% · 🏁 3 · 📋 —')
  // no rate limits: no fuel
  expect(renderLine({ reading: R(10), lap: 1, message: null }, FULL)).not.toContain('⛽')
})

test('renderLine: the last rise shows for 3 s, dim from the second one', () => {
  const at = (now: number) => buildRuns({ reading: R(30), lap: 1, message: null, now, delta: 4, deltaAt: 1000 }, FULL, LINE_MAX)
  expect(at(1000).map(r => r.text).join('')).toContain(' ↑4')
  expect(at(1000).find(r => r.text === ' ↑4')?.dim).toBe(false)
  expect(at(3000).find(r => r.text === ' ↑4')?.dim).toBe(true)
  expect(at(4000).find(r => r.text.includes('↑'))).toBeUndefined()
})

test('renderLine: emoji off is ASCII only, with no hex colour', () => {
  const input = { reading: R(85, [{ kind: 'seven_day', percentUsed: 80 }]), lap: 3, message: { text: REDLINE_MESSAGE, rank: 'redline' as const }, now: 5, flashAt: 0, fuelFlashAt: 0, delta: 2, deltaAt: 0 }
  const line = renderLine(input, ASCII)
  expect(line).toBe('revs 85% ########.. +2 | fuel 20% | stint 3 | board box this lap: /pit')
  expect(/^[\x20-\x7e]*$/.test(line)).toBe(true)
  expect(buildRuns(input, ASCII, LINE_MAX).every(r => r.color === undefined)).toBe(true)
  expect(/^[\x20-\x7e]*$/.test(renderLine({ reading: R(5), lap: 1, message: null }, ASCII))).toBe(true)
  for (const z of [1, 2] as const) expect(/^[\x20-\x7e]*$/.test(toastText(z, R(65), false) ?? '')).toBe(true)
})

test('buildRuns: soft is orange, hard is fixed bold red with no pulse, the ascii mode colours nothing', () => {
  const head = (percent: number, now = 0) => buildRuns({ reading: R(percent), lap: 1, message: null, now }, FULL, LINE_MAX)[0]!
  expect(head(10).color).toBeUndefined()
  expect(head(50).color).toBe('#f97316')
  expect(head(70)).toMatchObject({ color: '#ef4444', bold: true })
  // the same at any later instant: nothing repeats
  expect(head(70, 500)).toEqual(head(70, 1500))
  expect(buildRuns({ reading: R(70), lap: 1, message: null }, ASCII, LINE_MAX)[0]).toEqual({ text: 'revs 70% ', bold: true })
})

test('flash: 0.5 s of inverse bold after a crossing, once; the fuel segment flashes when it appears', () => {
  expect(flashing(1000, 1000)).toBe(true)
  expect(flashing(1000 + FLASH_MS - 1, 1000)).toBe(true)
  expect(flashing(1000 + FLASH_MS, 1000)).toBe(false)
  expect(flashing(5000, -1)).toBe(false)
  const revs = (now: number) => buildRuns({ reading: R(50), lap: 1, message: null, now, flashAt: 1000 }, FULL, LINE_MAX)[0]!
  expect(revs(1000)).toMatchObject({ bold: true, inverse: true })
  expect(revs(1600).inverse).toBeUndefined()
  expect(revs(9000).inverse).toBeUndefined()
  const fuel = (now: number) => buildRuns({ reading: R(10, [{ kind: 'five_hour', percentUsed: 85 }]), lap: 1, message: null, now, fuelFlashAt: 1000 }, FULL, LINE_MAX).find(r => r.text.startsWith('⛽'))!
  expect(fuel(1200).inverse).toBe(true)
  expect(fuel(1700).inverse).toBeUndefined()
})

test('renderLine: the board is cut first, revs, delta, fuel and stint are whole', () => {
  const long = 'x'.repeat(200)
  const line = renderLine({ reading: R(48, [{ kind: 'five_hour', percentUsed: 80 }]), lap: 12, message: { text: long, rank: 'warn' } }, FULL)
  expect(line.startsWith('🔥 revs 48% ▮▮▮▮▯▯▯▯▯▯ · ⛽ 20% · 🏁 12 · 📋 xxx')).toBe(true)
  expect(line.endsWith('…')).toBe(true)
  expect(cols(line)).toBeLessThanOrEqual(LINE_MAX)
  // in the band the budget is the band's width
  const band = buildRuns({ reading: R(48), lap: 1, message: { text: long, rank: 'warn' } }, FULL, 60)
  expect(cols(band.map(r => r.text).join(''))).toBeLessThanOrEqual(60)
})

test('toastText: one line per zone, with the window size when it is not 200k', () => {
  expect(toastText(0, R(10), true)).toBeNull()
  expect(toastText(1, R(41), true)).toBe('🔥 revs 41% · plan your pit')
  expect(toastText(2, R(65), true)).toBe('🚨 revs 65% · REDLINE · box this lap: /pit')
  expect(toastText(2, R(29, [], 1_000_000), true)).toBe('🚨 revs 29%/1M · REDLINE · box this lap: /pit')
})

test('canToast: one slot, redline > zone > positive, a live higher toast is never replaced', () => {
  const live = (kind: 'positive' | 'zone' | 'redline') => ({ kind, until: 1000 })
  expect(TOAST_MS).toEqual({ positive: 3000, zone: 5000, redline: 10_000 })
  expect(canToast(null, 'positive', 0)).toBe(true)
  expect(canToast(live('redline'), 'zone', 999)).toBe(false)
  expect(canToast(live('redline'), 'positive', 999)).toBe(false)
  expect(canToast(live('zone'), 'positive', 999)).toBe(false)
  expect(canToast(live('zone'), 'redline', 999)).toBe(true)
  expect(canToast(live('positive'), 'zone', 999)).toBe(true)
  // once it has run its time, anything goes
  expect(canToast(live('redline'), 'positive', 1000)).toBe(true)
})

// ---------- stint counter (pure) ----------

test('stintOf: absent, malformed or no file = 1', () => {
  expect(stintOf(null)).toBe(1)
  expect(stintOf('stream: x\ngoal: g\n')).toBe(1)
  expect(stintOf('stream: x\nstint: 4\ngoal: g\n')).toBe(4)
  expect(stintOf('stint: abc')).toBe(1)
  expect(stintOf('stint: 0')).toBe(1)
  expect(stintOf('stint: -2')).toBe(1)
})

const FORK = parseForkBody(parseFork('GATE: ok\nstatus: building\ngoal: g\nread_first:\n- /a — b').kind === 'ok' ? 'status: building\ngoal: g\nread_first:\n- /a — b' : '')
const asm = (stint?: number) => {
  if (!FORK) throw new Error('fork')
  const r = assemble({ stream: 'p', saved: '2026-10-26T10:00:00.000Z', sid: 's', prev: null, fork: FORK, stint })
  return r.kind === 'ok' ? r.state : ''
}

test('assemble: the stint field follows the header when given, and is left out otherwise', () => {
  expect(asm(3).split('\n').slice(0, 6)).toEqual(['stream: p', 'saved: 2026-10-26T10:00:00.000Z s', 'status: building', 'previous_session: none', 'goal: g', 'stint: 3'])
  expect(asm()).not.toContain('stint:')
  expect(stintOf(asm(7))).toBe(7)
})

// ---------- world ----------

const CWD = '/work'
const NOTES = `${CWD}/.stint/proj-notes.md`
type World = {
  statuses: (string | undefined)[]
  board: Board | undefined
  toasts: string[]
  toastMs: (number | undefined)[]
  usageCalls: number
  usage: { threshold?: number; window: number; tokens?: number; percent?: number; rateLimits: { kind: string; percentUsed: number }[] } | 'throws'
  clock: { advance: (ms: number) => Promise<void> }
  files: Map<string, string>
  forkText: string
  clears: number
  submits: string[]
}

function world(on: On): World {
  const w: World = {
    statuses: [],
    board: undefined,
    toasts: [],
    toastMs: [],
    usageCalls: 0,
    usage: { threshold: 167_000, window: 200_000, rateLimits: [] },
    clock: { advance: async () => undefined },
    files: new Map(),
    forkText: 'GATE: ok\nstatus: building\ngoal: g\nread_first:\n- /a — b',
    clears: 0,
    submits: [],
  }
  mock.store(on)
  w.clock = mock.clock(on, { now: 1_000_000 })
  on('ui.status', (_$, e) => (w.statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), w.toastMs.push(e.timeoutMs), { value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  // the board is written by other mods of the plugin; the test stands in for the host's value
  on('state.get', { plugin: 'stint', key: 'board' }, () => ({ value: { value: w.board, version: w.board ? 1 : 0 } }))
  on('session.usage', () => {
    w.usageCalls++
    if (w.usage === 'throws') throw new Error('usage down')
    const u = w.usage
    return { value: { startedAt: 0, context: { window: u.window, tokens: u.tokens, percent: u.percent, breakdown: u.threshold === undefined ? { isAutoCompactEnabled: false } : { autoCompactThreshold: u.threshold } }, rateLimits: u.rateLimits } } as never
  })
  on('session.cwd', () => ({ value: CWD }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('agent.list', () => ({ value: [] }) as never)
  on('model.fork', () => ({ value: { isAnswered: true, text: w.forkText, usage: { input_tokens: 1, output_tokens: 1 } } }) as never)
  on('fs.exists', (_$, e) => ({ value: w.files.has(e.path) }))
  on('fs.read', (_$, e) => {
    const text = w.files.get(e.path)
    return text === undefined ? { deny: 'ENOENT' } : { value: text }
  })
  on('fs.write', (_$, e) => (w.files.set(e.path, e.text), { value: undefined }))
  on('fs.list', (_$, e) => {
    const prefix = `${e.path}/`
    const names = [...w.files.keys()].filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length))
    return names.length === 0 ? { deny: 'ENOENT' } : ({ value: names.map(name => ({ name, kind: 'file', size: 1, mtimeMs: 0, isLink: false })) } as never)
  })
  on('session.measure', (_$, e) => ({ changed: [...e.changed] }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('classic.SessionStart', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  on('command.run', { command: 'clear' }, () => (w.clears++, {}))
  on('prompt.submit', (_$, e) => (w.submits.push(e.text), { text: e.text }))
  return w
}

const measure = ($: Engine, percent: number, rateLimits: { kind: string; percentUsed: number }[] = [], window = 200_000) =>
  $.session.measure({ context: { window, tokens: Math.round((percent / 100) * window), percent }, rateLimits, changed: ['context'] })
// what the host raises when the person picks a value in /config
const setDash = ($: Engine, value: string) => $.config.set({ key: 'stint.dash', value, previous: 'full', provider: { plugin: 'stint', tier: 'plugin' }, origin: { kind: 'composer' } } as never)
const last = (w: World) => w.statuses[w.statuses.length - 1]
const fresh = ($: Engine) => $.classic.SessionStart({ source: 'startup' })
const clear = ($: Engine) => $.classic.SessionStart({ source: 'clear' })
const run = ($: Engine, command: string, args = '') => $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
const prompt = ($: Engine) => $.classic.UserPromptSubmit({ prompt: 'x' })

// ---------- hooks ----------

const BAND = { plugin: 'stint', surface: 'terminal', component: 'AbovePrompt', requestId: 'band', viewport: { columns: 120, rows: 40, isFullscreen: false }, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 110, scroll: { first: 1, last: 1, of: 1 }, view: {} } } as never
const mountBand = ($: Engine) => $.ui.mount(BAND)
const bandText = async (ui: Awaited<ReturnType<typeof mountBand>>) => (await ui.findAll({ type: 'Text' })).map(t => t.text ?? '').join('')

test('measure: the status line shows revs and an empty board; zones come from absolute tokens', async ($, on) => {
  const w = world(on)
  await fresh($)
  expect(last(w)).toBeUndefined()
  await measure($, 22, [{ kind: 'five_hour', percentUsed: 9 }])
  // fuel at 91% is not shown
  expect(last(w)).toBe('🚀 revs 22% ▮▮▯▯▯▯▯▯▯▯ · 📋 —')
  await measure($, 39)
  expect(last(w)?.startsWith('🚀 revs 39%')).toBe(true)
  await measure($, 40)
  expect(last(w)?.startsWith('🔥 revs 40%')).toBe(true)
  await measure($, 59)
  expect(last(w)?.startsWith('🔥 revs 59%')).toBe(true)
  await measure($, 60)
  expect(last(w)).toBe('🚨 revs 60% ▮▮▮▮▮▮▯▯▯▯ ↑1 · 📋 box this lap: /pit')
  // the compaction wall is pit's rail: dash never pulls it
  expect(w.usageCalls).toBe(0)
})

test('measure: a 1M window shows its size and crosses on the same tokens; a 100k window caps by percent', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 7, [], 1_000_000)
  expect(last(w)).toBe('🚀 revs 7%/1M ▯▯▯▯▯▯▯▯▯▯ · 📋 —')
  await measure($, 8, [], 1_000_000)
  expect(last(w)?.startsWith('🔥 revs 8%/1M')).toBe(true)
  await measure($, 12, [], 1_000_000)
  expect(last(w)?.startsWith('🚨 revs 12%/1M')).toBe(true)
  expect(w.toasts).toEqual(['🔥 revs 8%/1M · plan your pit', '🚨 revs 12%/1M · REDLINE · box this lap: /pit'])

  await clear($)
  await measure($, 39, [], 100_000)
  expect(last(w)?.startsWith('🚀 revs 39%/100k')).toBe(true)
  await measure($, 40, [], 100_000)
  expect(last(w)?.startsWith('🔥 revs 40%/100k')).toBe(true)
  await measure($, 60, [], 100_000)
  expect(last(w)?.startsWith('🚨 revs 60%/100k')).toBe(true)
})

test('toasts: soft 5 s, hard 10 s, once per upward crossing, none on the way down, re-armed by /clear', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10)
  expect(w.toasts).toEqual([])
  await measure($, 41)
  expect(w.toasts).toEqual(['🔥 revs 41% · plan your pit'])
  expect(w.toastMs).toEqual([5000])
  await measure($, 55)
  expect(w.toasts).toHaveLength(1)
  await measure($, 61)
  expect(w.toasts[1]).toBe('🚨 revs 61% · REDLINE · box this lap: /pit')
  expect(w.toastMs).toEqual([5000, 10_000])
  await measure($, 90)
  expect(w.toasts).toHaveLength(2)
  // down (a compaction) then up again: announced again, once the slot is free
  await w.clock.advance(10_001)
  await measure($, 20)
  await measure($, 45)
  expect(w.toasts).toHaveLength(3)
  await w.clock.advance(10_001)
  await measure($, 90)
  const before = w.toasts.length
  await w.clock.advance(10_001)
  await clear($)
  await measure($, 90)
  expect(w.toasts.length).toBe(before + 1)
})

test('toasts: a jump across two zones announces the one reached', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10)
  await measure($, 65)
  expect(w.toasts).toEqual(['🚨 revs 65% · REDLINE · box this lap: /pit'])
})

test('toasts: one slot, redline > zone > positive, never stacked', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10)
  await measure($, 65)
  expect(w.toasts).toHaveLength(1)
  // inside the 10 s of the redline toast a soft crossing is not announced
  await measure($, 20)
  await measure($, 45)
  expect(w.toasts).toHaveLength(1)
  // nor the positive pit toast: the first measure of the fresh context settles it, and the slot is still taken
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  await measure($, 5)
  expect(pitToasts(w)).toEqual([])
  // past it, the pit toast shows for 3 s
  await w.clock.advance(10_001)
  await measure($, 30)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  await measure($, 12)
  expect(pitToasts(w)).toEqual(['✅ pit done · revs 30% → 12% ↓18'])
  expect(w.toastMs.at(-1)).toBe(3000)
  // a zone toast replaces a positive one still on screen
  await clear($)
  await measure($, 10)
  await measure($, 45)
  expect(w.toasts.at(-1)).toBe('🔥 revs 45% · plan your pit')
})

test('/clear drops the stale figure: no dash line until the next measure', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 70)
  expect(last(w)).toBeDefined()
  await clear($)
  expect(last(w)).toBeUndefined()
  await measure($, 5)
  expect(last(w)?.startsWith('🚀 revs 5%')).toBe(true)
})

test('board: a producer writes the slot, the line shows it; expiry empties it on the clock; alert beats redline', async ($, on) => {
  const w = world(on)
  await fresh($)
  w.board = { text: 'open fork: D1 undecided', level: 'warn', from: 'test', until: 1_000_000 + 5_000 }
  await measure($, 48)
  expect(last(w)).toBe('🔥 revs 48% ▮▮▮▮▯▯▯▯▯▯ · 📋 open fork: D1 undecided')
  await w.clock.advance(5_001)
  expect(last(w)).toBe('🔥 revs 48% ▮▮▮▮▯▯▯▯▯▯ · 📋 —')

  w.board = { text: 'pit now', level: 'info', from: 'test' }
  await measure($, 90)
  expect(last(w)?.endsWith('📋 box this lap: /pit')).toBe(true)
  w.board = { text: 'spotter: stop', level: 'alert', from: 'test' }
  await measure($, 91)
  expect(last(w)?.endsWith('📋 spotter: stop')).toBe(true)
})

test('fuel and stint: fuel appears below 30% and stays out above; the stint counter from the second stint', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10, [{ kind: 'five_hour', percentUsed: 69 }])
  expect(last(w)).not.toContain('⛽')
  await measure($, 10, [{ kind: 'five_hour', percentUsed: 75 }])
  expect(last(w)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · ⛽ 25% · 📋 —')
  expect(last(w)).not.toContain('🏁')
})

test('turn.complete fallback: one usage pull per main-thread turn until session.measure is seen', async ($, on) => {
  const w = world(on)
  w.usage = { threshold: 167_000, window: 200_000, tokens: 90_000, percent: 45, rateLimits: [{ kind: 'five_hour', percentUsed: 50 }] }
  await fresh($)
  await $.turn.complete({ answer: 'x', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(last(w)).toBe('🔥 revs 45% ▮▮▮▮▯▯▯▯▯▯ · 📋 —')
  // a subagent's turn is not the main context
  w.usage = { threshold: 167_000, window: 200_000, tokens: 150_000, percent: 75, rateLimits: [] }
  await $.turn.complete({ answer: 'x', durationMs: 1, isAborted: false, turnId: 't2', agentId: 'a1', reason: 'answer' })
  expect(last(w)?.startsWith('🔥 revs 45%')).toBe(true)
  // once the host pushes session.measure, the fallback stands down
  await measure($, 10)
  const calls = w.usageCalls
  await $.turn.complete({ answer: 'x', durationMs: 1, isAborted: false, turnId: 't3', reason: 'answer' })
  expect(w.usageCalls).toBe(calls)
  expect(last(w)?.startsWith('🚀 revs 10%')).toBe(true)
})

test('band: where it is raised it carries the dash and the status line is left empty; before that, the status line stands in', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 29)
  // no band raised (vscode, mobile): the status line carries the dash
  expect(last(w)).toBe('🚀 revs 29% ▮▮▯▯▯▯▯▯▯▯ · 📋 —')
  const ui = await mountBand($)
  expect(last(w)).toBeUndefined()
  expect(await bandText(ui)).toContain('revs 29%')
  expect(await bandText(ui)).toContain('📋')
  // pit goes to the board while the band is up, not to the status line
  await run($, 'pit', 'proj')
  expect(last(w)).toBeUndefined()
  expect(await bandText(ui)).toContain('saved')
  await ui.unmount()
})

test('band: dash ascii draws no emoji and no hex colour', { options: { dash: 'ascii' } }, async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 70)
  const ui = await mountBand($)
  const text = await bandText(ui)
  expect(text).toContain('revs 70%')
  expect(/[^\x20-\x7e]/.test(text)).toBe(false)
  await ui.unmount()
})

test('dash off: no dash line, no toast, no usage read; the pit lines stay', { options: { dash: 'off' } }, async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 90)
  expect(w.statuses.filter(s => s !== undefined)).toHaveLength(0)
  expect(w.toasts).toEqual([])
  expect(w.usageCalls).toBe(0)
  // pit still owns the slot, and gives it back empty; no positive toast either (the toast at the end is pit's own rejoin one)
  await run($, 'pit', 'proj')
  expect(last(w)).toBe('Starting a fresh session...')
  await w.clock.advance(5)
  await clear($)
  await measure($, 5)
  expect(last(w)).toBeUndefined()
  expect(w.toasts.filter(x => x === PIT_DONE_TOAST || x.includes('revs'))).toEqual([])
})

test('dash ascii: the line and the toasts are ASCII only', { options: { dash: 'ascii' } }, async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10, [{ kind: 'five_hour', percentUsed: 80 }])
  expect(last(w)).toBe('revs 10% #......... | fuel 20% | board -')
  await measure($, 45)
  await measure($, 65)
  expect(w.toasts).toEqual(['revs 45% - plan your pit', 'revs 65% - REDLINE - box this lap: /pit'])
  expect(/^[\x20-\x7e]*$/.test(last(w) ?? '')).toBe(true)
})

const pitToasts = (w: World) => w.toasts.filter(x => x.includes('pit done'))

test('pit done: the gain toast waits for the first measure of the fresh context, 3 s, with the measured values', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 30)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  // the /clear went through, no measure yet: no toast, no estimate
  expect(pitToasts(w)).toEqual([])
  await clear($)
  await measure($, 12)
  expect(pitToasts(w)).toEqual(['✅ pit done · revs 30% → 12% ↓18'])
  expect(w.toastMs.at(-1)).toBe(3000)
})

test('pit done: ↓N shows on the line for 3 s, then is gone; a later measure does not show it again', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 30)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  await measure($, 12)
  expect(last(w)).toBe('🚀 revs 12% ▮▯▯▯▯▯▯▯▯▯ ↓18 · 🏁 2 · 📋 —')
  await w.clock.advance(3_001)
  expect(last(w)).toBe('🚀 revs 12% ▮▯▯▯▯▯▯▯▯▯ · 🏁 2 · 📋 —')
  await measure($, 14)
  expect(last(w)?.includes('↓')).toBe(false)
  // the rise after the pit is the normal ↑N, the gain is not repeated on the next pit's toast
  expect(pitToasts(w)).toHaveLength(1)
})

test('pit done: with no pre-pit value the plain toast shows at once and no delta', async ($, on) => {
  const w = world(on)
  await fresh($)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  expect(pitToasts(w)).toEqual([PIT_DONE_TOAST])
  expect(w.toastMs.at(-1)).toBe(3000)
  await clear($)
  await measure($, 5)
  expect(last(w)?.includes('↓')).toBe(false)
  expect(pitToasts(w)).toHaveLength(1)
})

test('pit done: with no measure after the pit the plain toast shows once the wait is over, no delta', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 30)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  expect(pitToasts(w)).toEqual([])
  await w.clock.advance(PIT_WAIT_MS + 1)
  expect(pitToasts(w)).toEqual([PIT_DONE_TOAST])
  // a measure that comes later shows no gain
  await measure($, 12)
  expect(pitToasts(w)).toHaveLength(1)
  expect(last(w)?.includes('↓')).toBe(false)
})

test('pit done: a pit that did not lower the revs gets the plain toast and no delta', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  await measure($, 12)
  expect(pitToasts(w)).toEqual([PIT_DONE_TOAST])
  expect(last(w)?.includes('↓')).toBe(false)
})

test('pit done: ascii mode is ASCII only, in the toast and on the line', { options: { dash: 'ascii' } }, async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 30)
  await run($, 'pit', 'proj')
  await w.clock.advance(5)
  await clear($)
  await measure($, 12)
  expect(pitToasts(w)).toEqual(['pit done - revs 30% -> 12% -18'])
  expect(last(w)).toBe('revs 12% #......... -18 | stint 2 | board -')
  expect(/^[\x20-\x7e]*$/.test(pitToasts(w)[0]! + (last(w) ?? ''))).toBe(true)
})

test('pitDoneText: gain, plain, ascii', () => {
  expect(pitDoneText(true, { from: 30, to: 12 })).toBe('✅ pit done · revs 30% → 12% ↓18')
  expect(pitDoneText(true)).toBe(PIT_DONE_TOAST)
  expect(pitDoneText(false, { from: 30, to: 12 })).toBe('pit done - revs 30% -> 12% -18')
  expect(pitDoneText(false)).toBe('pit done - fresh window')
})

test('dash: a value outside full | ascii | off reads as full', { options: { dash: 'rainbow' } }, async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 10)
  expect(last(w)?.startsWith('🚀 revs 10%')).toBe(true)
})

test('modeOf: the three choices, anything else is full', () => {
  expect(DASH_MODES).toEqual(['full', 'ascii', 'off'])
  expect(modeOf('full')).toBe('full')
  expect(modeOf('ascii')).toBe('ascii')
  expect(modeOf('off')).toBe('off')
  expect([modeOf(undefined), modeOf(true), modeOf(false), modeOf('FULL'), modeOf('')]).toEqual(['full', 'full', 'full', 'full', 'full'])
})

// ---------- the /config row: one choice row, applied at once ----------

test('config.set: the line is redrawn at once in the new mode, no measure or prompt needed', async ($, on) => {
  const w = world(on)
  on('config.set', { key: 'stint.dash' }, (_$, e) => ({ value: e.value }))
  await fresh($)
  await measure($, 10, [{ kind: 'five_hour', percentUsed: 80 }])
  expect(last(w)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · ⛽ 20% · 📋 —')
  const calls = w.usageCalls
  expect(await setDash($, 'ascii')).toEqual({ value: 'ascii' })
  expect(last(w)).toBe('revs 10% #......... | fuel 20% | board -')
  expect(await setDash($, 'full')).toEqual({ value: 'full' })
  expect(last(w)).toBe('🚀 revs 10% ▮▯▯▯▯▯▯▯▯▯ · ⛽ 20% · 📋 —')
  // switching between full and ascii reuses the reading: no usage read
  expect(w.usageCalls).toBe(calls)
})

test('config.set off: the dash line is cleared at once, toasts stop, the pit lines stay; back on, it returns at once', async ($, on) => {
  const w = world(on)
  on('config.set', { key: 'stint.dash' }, (_$, e) => ({ value: e.value }))
  await fresh($)
  await measure($, 30)
  expect(last(w)?.startsWith('🚀 revs 30%')).toBe(true)
  await setDash($, 'off')
  expect(last(w)).toBeUndefined()
  // no toast and no line while off, even across a zone
  await measure($, 90)
  expect(w.toasts).toEqual([])
  expect(last(w)).toBeUndefined()
  // a pit line still shows, and the dash does not come back after it
  await run($, 'pit', 'proj')
  expect(last(w)).toBe('Starting a fresh session...')
  await w.clock.advance(5)
  await clear($)
  expect(last(w)).toBeUndefined()
  // back on: one usage read gives the figure, no wait for the next measure
  w.usage = { threshold: 167_000, window: 200_000, tokens: 90_000, percent: 45, rateLimits: [] }
  await setDash($, 'ascii')
  expect(last(w)?.startsWith('revs 45%')).toBe(true)
})

test('config.set: a denied change leaves the mode and the line as they were', async ($, on) => {
  const w = world(on)
  on('config.set', { key: 'stint.dash' }, () => ({ deny: 'locked' }))
  await fresh($)
  await measure($, 10)
  const before = last(w)
  expect(await setDash($, 'off')).toEqual({ deny: 'locked' })
  expect(last(w)).toBe(before)
})

// ---------- pit and dash share the status line; the stint counter ----------

test('pit: the flow and outcome lines win over the dash line; the dash line comes back after', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 30)
  expect(last(w)?.startsWith('🚀 revs 30%')).toBe(true)
  await run($, 'pit', 'proj')
  // the pit hands over: its flow line is up, not the dash line
  expect(last(w)).toBe('Starting a fresh session...')
  await w.clock.advance(5)
  expect(w.clears).toBe(1)
  await clear($)
  expect(last(w)).toBeUndefined()
  await measure($, 5)
  expect(last(w)).toBe('🚀 revs 5% ▯▯▯▯▯▯▯▯▯▯ ↓25 · 🏁 2 · 📋 —')
})

test('stint counter: +1 per successful /pit (absent = 1), shown as the lap, set by /rejoin, reset by a new session', async ($, on) => {
  const w = world(on)
  await fresh($)
  await run($, 'pit', 'proj')
  expect(w.files.get(NOTES)).toContain('\nstint: 2\n')
  await w.clock.advance(5)
  await clear($)
  await measure($, 5)
  expect(last(w)).toContain('🏁 2')

  await run($, 'pit', 'proj')
  expect(w.files.get(NOTES)).toContain('\nstint: 3\n')
  await w.clock.advance(5)
  await clear($)
  await measure($, 5)
  expect(last(w)).toContain('🏁 3')

  // a new session starts at 1, /rejoin takes the number from the notes
  await fresh($)
  await prompt($)
  await measure($, 5)
  expect(last(w)).not.toContain('🏁')
  await run($, 'rejoin', 'proj')
  await w.clock.advance(5)
  await measure($, 5)
  expect(last(w)).toContain('🏁 3')
})

test('stint counter: a refused or failed /pit leaves it where it was', async ($, on) => {
  const w = world(on)
  await fresh($)
  w.forkText = 'GATE: blocked - mid synthesis'
  await run($, 'pit', 'proj')
  expect(w.files.has(NOTES)).toBe(false)
  expect(last(w)).toMatch(/^⚠ /)
  await clear($)
  await measure($, 5)
  expect(last(w)).not.toContain('🏁')
})

test('stint counter: notes written before the field existed count as stint 1, the next pit writes 2', async ($, on) => {
  const w = world(on)
  w.files.set(NOTES, 'stream: proj\nsaved: 2026-10-21T10:00:00.000Z old\nstatus: building\nprevious_session: none\ngoal: g\n\nread_first:\ndeliverable: none\n')
  await fresh($)
  await run($, 'pit', 'proj')
  expect(w.files.get(NOTES)).toContain('\nstint: 2\n')
})

// ---------- the pit on the band's board ----------

test('pickBoard: the pit outranks alert, redline, warn and info; a failure is red, the rest plain', () => {
  const stored = (level: 'info' | 'warn' | 'alert') => ({ text: 'note', level }) as Board
  for (const level of ['info', 'warn', 'alert'] as const) {
    expect(pickBoard(stored(level), 0, true, { text: 'saved 9.8k -> clearing' })).toEqual({ text: 'saved 9.8k -> clearing', rank: 'pit', bad: false })
  }
  expect(pickBoard(undefined, 0, true)?.rank).toBe('redline')
  const input = { reading: R(10), lap: 1 }
  const style = (bad: boolean) => buildRuns({ ...input, message: { text: 'x', rank: 'pit', bad } }, FULL, LINE_MAX).at(-1)!
  expect(style(false).dim).toBeUndefined()
  expect(style(false).color).toBeUndefined()
  expect(style(true).bold).toBe(true)
  expect(style(true).color).toBeDefined()
})

test('pit on the band: saved, then back on track for 3 s; the status line stays empty and the transcript has one line', async ($, on) => {
  const w = world(on)
  await fresh($)
  await measure($, 64)
  const ui = await mountBand($)
  const shown = w.statuses.length
  const out = await run($, 'pit', 'proj')
  expect(out).toEqual({ text: 'pit: saved .stint/proj-notes.md' })
  expect(await bandText(ui)).toMatch(/saved \d+(\.\d)?k? -> clearing/)
  expect(w.statuses.slice(shown).filter(s => s !== undefined)).toEqual([])
  // the host starts the fresh session (SessionStart clear) before the /clear command resolves
  await clear($)
  await w.clock.advance(5)
  await measure($, 3)
  expect(await bandText(ui)).toContain('back on track, stint 2')
  expect(w.statuses.slice(shown).filter(s => s !== undefined)).toEqual([])
  await w.clock.advance(3_001)
  expect(await bandText(ui)).toContain('📋 —')
})

test('pit failure on the band: red and sticky until the next command, nothing on the status line', async ($, on) => {
  const w = world(on)
  w.forkText = 'GATE: blocked - mid synthesis'
  await fresh($)
  await measure($, 64)
  const ui = await mountBand($)
  const shown = w.statuses.length
  await run($, 'pit', 'proj')
  expect(await bandText(ui)).toContain('PIT FAILED, session kept')
  await w.clock.advance(120_000)
  expect(await bandText(ui)).toContain('PIT FAILED, session kept')
  expect(w.statuses.slice(shown).filter(s => s !== undefined)).toEqual([])
  w.forkText = 'GATE: ok\nstatus: building\ngoal: g\nread_first:\n- /a — b'
  await run($, 'pit', 'proj')
  expect(await bandText(ui)).not.toContain('PIT FAILED')
})

test('pit with no band raised: the flow and the failure go to the status line, the board slot is only for the band', async ($, on) => {
  const w = world(on)
  w.forkText = 'GATE: blocked - mid synthesis'
  await fresh($)
  await measure($, 64)
  await run($, 'pit', 'proj')
  expect(last(w)).toMatch(/^⚠ /)
})
