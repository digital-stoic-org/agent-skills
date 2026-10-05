import type { Register } from 'claude-code'

import { registerSelfRelay } from './self-relay.tsx'

export const register: Register = on => {
  registerSelfRelay(on)
}
