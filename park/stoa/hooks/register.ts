import type { Register } from 'claude-code'

import { registerKeel } from './keel.ts'
import { registerPack } from './pack.tsx'
import { registerSession } from './stoa-session.ts'
import { registerTack } from './tack.ts'

// Hook order follows registration order: tack goes after pack (tack inner, REPORT-tack P-c).
export const register: Register = on => {
  registerPack(on)
  registerKeel(on)
  registerSession(on)
  registerTack(on)
}
