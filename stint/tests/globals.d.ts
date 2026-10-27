// The tests wait on the real clock in two places; the hooks module has no timers of its own, so the config declares no DOM or Node types.
declare function setTimeout(handler: (...args: any[]) => void, ms?: number): unknown
