import type { EngineInterface, On } from 'claude-code'
import { KEEL_COMMAND } from './keel.ts'
import { TACK_COMMAND } from './tack-core.ts'

// One `session.*` glob for the whole plugin: pack owns the exact `session.start` and the host throws on a repeated (pattern, matcher), so the mods that
// declare a slash command at session start (keel, tack) share this hook. Each mod exports a pure spec; the `$.command.register` call lives here because the
// validator does not follow `$` across an import. The glob sees every session event (about 35 per prompt): only `session.start` does anything.
const COMMANDS = [KEEL_COMMAND, TACK_COMMAND]

async function declareCommands($: EngineInterface): Promise<void> {
  for (const command of COMMANDS) {
    try {
      await $.command.register(command)
    } catch (err) {
      try {
        $.ui.log(`stoa: command ${command.name} not registered: ${String(err)}`, { to: 'debug' })
      } catch {
        // nothing left to do
      }
    }
  }
}

export function registerSession(on: On): void {
  on('session.*', async ($, e, next) => {
    if (next.is('session.start', e)) await declareCommands($)
    return next(e)
  }).catch(($, e, next) => {
    try {
      $.ui.log(`stoa: session hook failed: ${String(next.error)}`, { to: 'debug' })
    } catch {
      // nothing left to do
    }
    return next(e)
  })
}
