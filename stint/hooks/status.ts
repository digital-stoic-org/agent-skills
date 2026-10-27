import type { EngineInterface } from 'claude-code'

// The status line has one slot per plugin ($.ui.status), so stint writes it from one place.
// pit sets its own line (flow, outcome, hint); dash sets the instruments. Both reach the status line only where the AbovePrompt band is never raised (vscode, mobile): elsewhere the band's board carries them. pit's line wins while it has one.

let pitLine: string | undefined
let dashLine: string | undefined
// The pit's message for the band's board slot, and whether the band was ever raised (then the status line stays empty).
export type PitBoard = { text: string; bad?: boolean }
let pitBoard: PitBoard | undefined
let bandUp = false

export function setPitBoard(msg: PitBoard | undefined) {
  pitBoard = msg
}

export const getPitBoard = () => pitBoard

export function setBandUp(up: boolean) {
  bandUp = up
}

export function setPitLine(text: string | undefined) {
  pitLine = text
}

export function setDashLine(text: string | undefined) {
  dashLine = text
}

export function writeStatus($: EngineInterface) {
  $.ui.status(bandUp ? undefined : (pitLine ?? dashLine))
}
