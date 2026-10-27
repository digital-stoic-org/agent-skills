import type { EngineInterface } from 'claude-code'

// The status line has one slot per plugin ($.ui.status), so stint writes it from one place.
// pit sets its own line (flow, outcome, hint); dash sets the instruments only where the AbovePrompt band is never raised (vscode, mobile). pit's line wins while it has one.

let pitLine: string | undefined
let dashLine: string | undefined

export function setPitLine(text: string | undefined) {
  pitLine = text
}

export function setDashLine(text: string | undefined) {
  dashLine = text
}

export function writeStatus($: EngineInterface) {
  $.ui.status(pitLine ?? dashLine)
}
