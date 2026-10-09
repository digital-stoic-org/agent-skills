import type { Register } from 'claude-code'

import { registerKeel } from './keel.ts'
import { registerPack } from './pack.tsx'

export const register: Register = on => {
  registerPack(on)
  registerKeel(on)
}
