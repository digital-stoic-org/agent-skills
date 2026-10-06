import type { Register } from 'claude-code'

import { registerPack } from './pack.tsx'

export const register: Register = on => {
  registerPack(on)
}
