// $.state contract of the stint plugin. Any plugin reads these values; only stint (any of its mods) writes them.

export type BoardLevel = 'info' | 'warn' | 'alert'

// The dash board slot (📋 pit board): one short message, rendered last on the band.
//   text   what the slot says (truncated first when the line is too wide)
//   level  info < warn < alert; the dash redline message (`box this lap: /pit`) ranks between warn and alert
//   from   the producer's name
//   until  epoch ms (same clock as $.clock.now()); once past, the slot is empty again
export type Board = { text: string; level: BoardLevel; from: string; until?: number }

declare module 'claude-code' {
  interface PluginState {
    stint: {
      board: Board
      // The stint number shown by the dash (the notes header `stint` field), 1 in a new session.
      lap: number
    }
  }
}
