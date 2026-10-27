import type { EngineInterface, On, PluginOptions, SessionContextUsage, SessionRateLimit } from 'claude-code'
import type { Board } from '../types'
import { getPitBoard, setBandUp, setDashLine, writeStatus } from './status.ts'
import type { PitBoard } from './status.ts'

// dash (stint): the car's instruments, in a band above the prompt.
//   revs   context fill, % of the model window (the native status line's figure); `/1M` after it when the window is not 200k
//   ↑N     the last rise of revs, for 3 s
//   fuel   what is left of the tighter plan window (five_hour / seven_day); shown only below 30 %
//   stint  the stint counter (notes header `stint`); shown from the second stint
//   board  one short message from $.state { plugin: 'stint', key: 'board' }; `—` when empty
// Two zones, on absolute tokens (80k soft, 120k hard, never past 40 % / 60 % of a small window). The measured auto-compaction wall is pit's own rail and is not read here.
// The band (terminal, desktop) is drawn by band.ts from bandRuns(); where it is never raised (vscode, mobile) the same line goes to the status line, which pit's lines win.
// Figures come from session.measure; until that event is seen live, turn.complete + $.session.usage() gives the same reading once per turn.

const BOARD = { plugin: 'stint', key: 'board' } as const
const LAP = { plugin: 'stint', key: 'lap' } as const

export const SOFT_TOKENS = 80_000
export const HARD_TOKENS = 120_000
export const SOFT_PERCENT = 40
export const HARD_PERCENT = 60
export const BASE_WINDOW = 200_000
export const BAR_CELLS = 10
export const FUEL_BELOW = 30
export const FLASH_MS = 500
export const DELTA_MS = 3000
export const DELTA_DIM_MS = 2000
// The board gives way first: revs, delta, fuel and the stint counter are never truncated.
export const LINE_MAX = 80
export const BOARD_MIN = 12
export const REDLINE_MESSAGE = 'box this lap: /pit'
export const PIT_DONE_TOAST = '✅ pit done · fresh window'
// How long a finished pit waits for the first measure of the fresh context before it settles for the plain toast.
export const PIT_WAIT_MS = 30_000

export type Zone = 0 | 1 | 2
export type Reading = { percent: number; tokens: number; window: number; rateLimits: readonly SessionRateLimit[] }
export type DashOptions = { emoji: boolean }
// The `dash` option: full = emoji band, ascii = ASCII-only band without hex colours, off = no band, no status line and no toasts.
export const DASH_MODES = ['full', 'ascii', 'off'] as const
export type DashMode = (typeof DASH_MODES)[number]
export const DASH_KEY = 'stint.dash'

export function modeOf(value: unknown): DashMode {
  return DASH_MODES.find(m => m === value) ?? 'full'
}

const ZONE_EMOJI = ['🚀', '🔥', '🚨'] as const
const RED = '#ef4444'
const ORANGE = '#f97316'
const YELLOW = '#eab308'
const STOPS = [
  [0x22, 0xc5, 0x5e],
  [0xea, 0xb3, 0x08],
  [0xef, 0x44, 0x44],
] as const

// ---------- pure helpers ----------

// Soft and hard in tokens: 80k and 120k, capped by 40 % and 60 % of a window under 200k.
export function thresholdsOf(window: number): { soft: number; hard: number } {
  return { soft: Math.min(SOFT_TOKENS, (window * SOFT_PERCENT) / 100), hard: Math.min(HARD_TOKENS, (window * HARD_PERCENT) / 100) }
}

export function zoneOf(tokens: number, window: number): Zone {
  const { soft, hard } = thresholdsOf(window)
  if (tokens >= hard) return 2
  if (tokens >= soft) return 1
  return 0
}

// `/1M` after the percentage when the window is not the 200k the thresholds are written for.
export function windowTag(window: number): string {
  if (window === BASE_WINDOW) return ''
  if (window >= 1_000_000) return `/${Number((window / 1_000_000).toFixed(1))}M`
  return `/${Math.round(window / 1000)}k`
}

// One cell = 10%, a cell is lit once fully earned.
export function bar(percent: number, emoji: boolean): string {
  const lit = Math.min(BAR_CELLS, Math.max(0, Math.floor(percent / (100 / BAR_CELLS))))
  const [on, off] = emoji ? ['▮', '▯'] : ['#', '.']
  return (on as string).repeat(lit) + (off as string).repeat(BAR_CELLS - lit)
}

// green -> yellow -> red over the ten cells
export function cellColor(i: number): string {
  const t = i / (BAR_CELLS - 1)
  const [a, b, f] = t < 0.5 ? [STOPS[0], STOPS[1], t * 2] : [STOPS[1], STOPS[2], (t - 0.5) * 2]
  const hex = (k: 0 | 1 | 2) => Math.round(a[k] + (b[k] - a[k]) * f).toString(16).padStart(2, '0')
  return `#${hex(0)}${hex(1)}${hex(2)}`
}

// What is left of the tighter window, whole %; null when the host gives none. Plan windows first, any other kind (a gateway's spend_limit) only when no plan window is there.
export function fuelOf(rateLimits: readonly SessionRateLimit[]): number | null {
  const plan = rateLimits.filter(r => r.kind === 'five_hour' || r.kind === 'seven_day')
  const used = (plan.length ? plan : rateLimits).map(r => r.percentUsed)
  if (used.length === 0) return null
  return Math.min(100, Math.max(0, Math.round(100 - Math.max(...used))))
}

// `pit` is the /pit flow or outcome (`bad`: a failure, drawn red); it outranks everything on the board.
export type Message = { text: string; rank: 'info' | 'warn' | 'redline' | 'alert' | 'pit'; bad?: boolean }
const RANK = { info: 0, warn: 1, redline: 2, alert: 3, pit: 4 } as const

// The slot's message: alert > redline > warn > info; a stored board message past its `until` is gone.
export function pickBoard(stored: Board | undefined, now: number, inHard: boolean, pit?: PitBoard): Message | null {
  const live = stored && (stored.until === undefined || stored.until > now) && stored.text.trim() !== '' ? stored : undefined
  const candidates: Message[] = []
  if (live) candidates.push({ text: live.text.replace(/\s+/g, ' ').trim(), rank: live.level })
  if (inHard) candidates.push({ text: REDLINE_MESSAGE, rank: 'redline' })
  if (pit) candidates.push({ text: pit.text, rank: 'pit', bad: pit.bad === true })
  candidates.sort((a, b) => RANK[b.rank] - RANK[a.rank])
  return candidates[0] ?? null
}

// Terminal columns, roughly: emoji take two, the variation selector none.
export function cols(s: string): number {
  let n = 0
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number
    n += cp === 0xfe0f ? 0 : cp >= 0x1f000 || cp === 0x26fd || cp === 0x2705 ? 2 : 1
  }
  return n
}

export function fit(text: string, budget: number, emoji: boolean): string {
  if (cols(text) <= budget) return text
  const mark = emoji ? '…' : '...'
  const chars = [...text]
  let out = ''
  for (const ch of chars) {
    if (cols(out + ch + mark) > budget) break
    out += ch
  }
  return out + mark
}

export type Run = { text: string; color?: string; bold?: boolean; dim?: boolean; inverse?: boolean }
export type LineInput = {
  reading: Reading
  lap: number
  message: Message | null
  // Epoch ms of the draw and of the events that flash or show for a while; -1 = never.
  now?: number
  flashAt?: number
  fuelFlashAt?: number
  delta?: number
  deltaAt?: number
  // The revs points a pit just freed, shown like the rise for 3 s.
  gain?: number
  gainAt?: number
}

export const flashing = (now: number, at: number) => at >= 0 && now >= at && now - at < FLASH_MS
const widthOf = (runs: readonly Run[]) => runs.reduce((n, r) => n + cols(r.text), 0)

// The line as styled runs.
export function buildRuns(input: LineInput, { emoji }: DashOptions, columns: number): Run[] {
  const { reading, lap, message } = input
  const now = input.now ?? 0
  const zone = zoneOf(reading.tokens, reading.window)
  const fuel = fuelOf(reading.rateLimits)
  const sep: Run = { text: emoji ? ' · ' : ' | ', dim: true }
  const hot = (hex: string): Partial<Run> => (emoji ? { color: hex } : {})
  const flash: Partial<Run> = { bold: true, inverse: true }

  const zoneStyle: Partial<Run> = zone === 2 ? { bold: true, ...hot(RED) } : zone === 1 ? hot(ORANGE) : {}
  const revsStyle = flashing(now, input.flashAt ?? -1) ? flash : zoneStyle
  const runs: Run[] = [{ text: `${emoji ? `${ZONE_EMOJI[zone]} ` : ''}revs ${Math.round(reading.percent)}%${windowTag(reading.window)} `, ...revsStyle }]
  if (emoji) {
    const lit = Math.min(BAR_CELLS, Math.max(0, Math.floor(reading.percent / (100 / BAR_CELLS))))
    for (let i = 0; i < BAR_CELLS; i++) runs.push(i < lit ? { text: '▮', color: cellColor(i) } : { text: '▯', dim: true })
  } else {
    runs.push({ text: bar(reading.percent, false) })
  }
  const age = now - (input.deltaAt ?? -1)
  if ((input.deltaAt ?? -1) >= 0 && (input.delta ?? 0) > 0 && age >= 0 && age < DELTA_MS) runs.push({ text: emoji ? ` ↑${input.delta}` : ` +${input.delta}`, dim: age >= DELTA_DIM_MS })
  const gainAge = now - (input.gainAt ?? -1)
  if ((input.gainAt ?? -1) >= 0 && (input.gain ?? 0) > 0 && gainAge >= 0 && gainAge < DELTA_MS) runs.push({ text: emoji ? ` ↓${input.gain}` : ` -${input.gain}`, dim: true })
  if (fuel !== null && fuel < FUEL_BELOW) {
    runs.push(sep, { text: emoji ? `⛽ ${fuel}%` : `fuel ${fuel}%`, ...hot(YELLOW), ...(flashing(now, input.fuelFlashAt ?? -1) ? flash : {}) })
  }
  if (lap >= 2) runs.push(sep, { text: emoji ? `🏁 ${lap}` : `stint ${lap}` })
  const label = emoji ? '📋 ' : 'board '
  runs.push(sep, { text: label })
  const budget = Math.max(BOARD_MIN, columns - widthOf(runs))
  const style: Partial<Run> = !message || message.rank === 'info' ? { dim: true } : message.rank === 'warn' ? hot(YELLOW) : message.rank === 'pit' && !message.bad ? {} : { bold: true, ...hot(RED) }
  runs.push({ text: message ? fit(message.text, budget, emoji) : emoji ? '—' : '-', ...style })
  return runs
}

export function renderLine(input: LineInput, options: DashOptions): string {
  return buildRuns(input, options, LINE_MAX).map(r => r.text).join('')
}

export function toastText(zone: Zone, reading: Pick<Reading, 'percent' | 'window'>, emoji: boolean): string | null {
  const mark = (z: Zone) => (emoji ? `${ZONE_EMOJI[z]} ` : '')
  const dot = emoji ? '·' : '-'
  const revs = `revs ${Math.round(reading.percent)}%${windowTag(reading.window)}`
  if (zone === 1) return `${mark(1)}${revs} ${dot} plan your pit`
  if (zone === 2) return `${mark(2)}${revs} ${dot} REDLINE ${dot} ${REDLINE_MESSAGE}`
  return null
}

// The toast of a finished pit: with the measured revs before and after when both are known, plain otherwise.
export function pitDoneText(emoji: boolean, gain?: { from: number; to: number }): string {
  if (!gain) return emoji ? PIT_DONE_TOAST : 'pit done - fresh window'
  const n = gain.from - gain.to
  return emoji ? `✅ pit done · revs ${gain.from}% → ${gain.to}% ↓${n}` : `pit done - revs ${gain.from}% -> ${gain.to}% -${n}`
}

// One toast slot per plugin: a live toast is only replaced by one of the same or a higher kind.
export type ToastKind = 'positive' | 'zone' | 'redline'
export const TOAST_MS: Record<ToastKind, number> = { positive: 3000, zone: 5000, redline: 10_000 }
const TOAST_RANK: Record<ToastKind, number> = { positive: 0, zone: 1, redline: 2 }
export type ToastSlot = { kind: ToastKind; until: number } | null

export function canToast(slot: ToastSlot, kind: ToastKind, now: number): boolean {
  return slot === null || slot.until <= now || TOAST_RANK[slot.kind] <= TOAST_RANK[kind]
}

// ---------- module state (lost on mod reload; the stint number and the board live in $.state) ----------

let mode: DashMode = 'full'
let reading: Reading | null = null
let lap = 1
let board: Board | undefined
let nowMs = 0
// Highest zone already announced; undefined until the first reading of this module load, so a reload mid-session stays quiet.
let lastZone: Zone | undefined
// session.measure has fired at least once: the turn.complete fallback stands down.
let measured = false
let boardTimer: { cancel: () => void } | null = null
// What the band shows for a while: the zone-crossing flash, the fuel reveal flash, the last rise.
let flashAt = -1
let fuelFlashAt = -1
let fuelShown = false
let delta = 0
let deltaAt = -1
// The band has been raised (terminal, desktop): the status line is left to pit.
let bandSeen = false
let toastSlot: ToastSlot = null
// The pit's gain: revs % at the last measure before the /clear, then the wait for the first measure of the fresh context.
let pitFrom: number | null = null
let pitWait: { from: number } | null = null
let pitTimer: { cancel: () => void } | null = null
let gain = 0
let gainAt = -1

const inputOf = (now: number): LineInput | null =>
  reading === null ? null : { reading, lap, message: pickBoard(board, now, zoneOf(reading.tokens, reading.window) === 2, getPitBoard()), now, flashAt, fuelFlashAt, delta, deltaAt, gain, gainAt }

// The status-line text, or undefined while dash is off or has no reading yet (fresh session, just cleared).
export function dashLine(): string | undefined {
  const input = mode === 'off' ? null : inputOf(nowMs)
  return input ? renderLine(input, { emoji: mode === 'full' }) : undefined
}

function repaint($: EngineInterface) {
  setDashLine(bandSeen ? undefined : dashLine())
  writeStatus($)
  $.ui.invalidate('ui.render')
}

// The band's runs at the host clock, or null while there is nothing to draw.
export async function bandRuns($: EngineInterface, columns: number): Promise<Run[] | null> {
  const input = mode === 'off' ? null : inputOf(await $.clock.now())
  return input ? buildRuns(input, { emoji: mode === 'full' }, columns) : null
}

// The band was raised: the status line stops carrying the dash.
export function markBand($: EngineInterface) {
  if (bandSeen) return
  bandSeen = true
  // With dash off the band draws nothing, so the pit lines keep the status line.
  setBandUp(mode !== 'off')
  setDashLine(undefined)
  writeStatus($)
}

async function announce($: EngineInterface, text: string, kind: ToastKind) {
  if (mode === 'off') return
  const now = await $.clock.now()
  if (!canToast(toastSlot, kind, now)) return
  toastSlot = { kind, until: now + TOAST_MS[kind] }
  $.ui.toast(text, { timeoutMs: TOAST_MS[kind] })
}

// pit calls this just before the /clear: the revs of the last measure are the "before".
export function pitStart() {
  pitFrom = reading ? Math.round(reading.percent) : null
}

// pit calls this once the /clear went through. With a "before" the toast waits for the first measure of the fresh context (ingest settles it); after PIT_WAIT_MS without one, or with no "before", it is the plain toast.
export async function pitDone($: EngineInterface) {
  if (mode === 'off') return
  const from = pitFrom
  pitFrom = null
  if (from === null) {
    await announce($, pitDoneText(mode === 'full'), 'positive')
    return
  }
  pitWait = { from }
  pitTimer?.cancel()
  pitTimer = $.clock.after(PIT_WAIT_MS, async () => {
    pitTimer = null
    if (pitWait === null) return
    pitWait = null
    await announce($, pitDoneText(mode === 'full'), 'positive')
  })
}

// The first measure after a pit: the real "after". A pit that did not lower the revs gets the plain toast and no delta.
async function settlePit($: EngineInterface, percent: number) {
  if (pitWait === null) return
  const from = pitWait.from
  pitWait = null
  pitTimer?.cancel()
  pitTimer = null
  const to = Math.round(percent)
  if (from <= to) {
    await announce($, pitDoneText(mode === 'full'), 'positive')
    return
  }
  gain = from - to
  gainAt = nowMs
  redrawIn($, DELTA_MS)
  await announce($, pitDoneText(mode === 'full', { from, to }), 'positive')
}

export async function setLap($: EngineInterface, n: number) {
  lap = n
  await $.state.set(LAP, n)
}

// Redraw once the flash or the rise has run its course.
function redrawIn($: EngineInterface, ms: number) {
  $.clock.after(ms + 1, async () => {
    nowMs = await $.clock.now()
    repaint($)
  })
}

function armBoardTimer($: EngineInterface) {
  boardTimer?.cancel()
  boardTimer = null
  if (board?.until === undefined || board.until <= nowMs) return
  boardTimer = $.clock.after(board.until - nowMs + 1, async () => {
    boardTimer = null
    nowMs = await $.clock.now()
    repaint($)
  })
}

async function ingest($: EngineInterface, context: SessionContextUsage, rateLimits: readonly SessionRateLimit[]) {
  if (mode === 'off') return
  nowMs = await $.clock.now()
  lap = (await $.state.get(LAP)).value ?? lap
  board = (await $.state.get(BOARD)).value
  armBoardTimer($)

  const window = context.window > 0 ? context.window : BASE_WINDOW
  const percent = context.percent ?? (context.tokens !== undefined ? Math.round((context.tokens / window) * 100) : undefined)
  if (percent === undefined) {
    reading = null
    repaint($)
    return
  }
  const rise = reading ? Math.round(percent - reading.percent) : 0
  reading = { percent, tokens: context.tokens ?? Math.round((percent / 100) * window), window, rateLimits }
  if (rise > 0) {
    delta = rise
    deltaAt = nowMs
    redrawIn($, DELTA_DIM_MS)
    redrawIn($, DELTA_MS)
  }

  const fuel = fuelOf(rateLimits)
  const showFuel = fuel !== null && fuel < FUEL_BELOW
  if (showFuel && !fuelShown) {
    fuelFlashAt = nowMs
    redrawIn($, FLASH_MS)
  }
  fuelShown = showFuel

  const zone = zoneOf(reading.tokens, window)
  if (lastZone !== undefined && zone > lastZone) {
    flashAt = nowMs
    redrawIn($, FLASH_MS)
    const text = toastText(zone, reading, mode === 'full')
    if (text) await announce($, text, zone === 2 ? 'redline' : 'zone')
  }
  lastZone = zone
  await settlePit($, percent)
  repaint($)
}

function noteCaught($: EngineInterface, hook: string, error: { kind: string; message?: string }) {
  try {
    $.ui.log(`stint: dash ${hook} hook ${error.kind}${error.message ? `: ${error.message}` : ''}`, { to: 'debug' })
  } catch {
    // nothing left to do
  }
}

// `dash` (full | ascii | off, default full) is one /config choice row; a change applies at once through the config.set hook.
export function registerDash(on: On, userOptions: PluginOptions) {
  mode = modeOf(userOptions.dash)
  reading = null
  lap = 1
  board = undefined
  nowMs = 0
  lastZone = undefined
  measured = false
  boardTimer = null
  flashAt = -1
  fuelFlashAt = -1
  fuelShown = false
  delta = 0
  deltaAt = -1
  bandSeen = false
  setBandUp(false)
  toastSlot = null
  pitFrom = null
  pitWait = null
  pitTimer = null
  gain = 0
  gainAt = -1

  // Applied the moment the row changes: the line is redrawn (or cleared) without waiting for a measure.
  on('config.set', { key: DASH_KEY }, async ($, e, next) => {
    const result = await next(e)
    if ('deny' in result && result.deny !== undefined) return result
    const was = mode
    mode = modeOf(e.value)
    if (bandSeen) setBandUp(mode !== 'off')
    // Coming back from off there is no figure yet: one usage read gives it.
    if (was === 'off' && mode !== 'off') {
      const usage = await $.session.usage({ breakdown: 'summary' })
      await ingest($, usage.context, usage.rateLimits)
    }
    repaint($)
    return result
  }).catch(($, e, next) => {
    noteCaught($, 'config.set dash', next.error)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    measured = true
    await ingest($, e.context, e.rateLimits)
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'session.measure', next.error)
    return next(e)
  })

  // Fallback while session.measure has not fired: one free usage pull per main-thread turn.
  on('turn.complete', async ($, e, next) => {
    if (!measured && e.agentId === undefined) {
      const usage = await $.session.usage({ breakdown: 'summary' })
      await ingest($, usage.context, usage.rateLimits)
    }
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'turn.complete', next.error)
    return next(e)
  })

  on('state.set', { plugin: 'stint', key: 'board' }, async ($, e, next) => {
    const result = await next(e)
    board = e.value
    nowMs = await $.clock.now()
    armBoardTimer($)
    repaint($)
    return result
  }).catch(($, e, next) => {
    noteCaught($, 'state.set board', next.error)
    return next(e)
  })

  // A new window: the old figure is stale and the zone toasts are armed again. Only $.state and $.clock are touched.
  // One registration per source: pit already holds the matcher-less classic.SessionStart.
  for (const source of ['startup', 'resume', 'fork', 'clear', 'compact'] as const) {
    on('classic.SessionStart', { source }, async ($, e, next) => {
      reading = null
      lastZone = 0
      flashAt = -1
      fuelFlashAt = -1
      fuelShown = false
      delta = 0
      deltaAt = -1
      if (source === 'startup' || source === 'resume' || source === 'fork') {
        pitFrom = null
        pitWait = null
        await setLap($, 1)
      }
      repaint($)
      return next(e)
    }).catch(($, e, next) => {
      noteCaught($, 'classic.SessionStart', next.error)
      return next(e)
    })
  }
}
