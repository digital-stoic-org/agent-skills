import type { Register } from 'claude-code'

import { registerPit } from './pit.ts'

export const register: Register = on => {
  registerPit(on)
}
