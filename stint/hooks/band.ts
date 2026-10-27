import type { On } from 'claude-code'

import { bandRuns, markBand } from './dash.ts'
import type { Run } from './dash.ts'

// The AbovePrompt band: the dash runs, one line. Raised on terminal and desktop only.

// only the styles a run sets, so no prop is passed undefined
const propsOf = (r: Run) => ({
  ...(r.color !== undefined ? { color: r.color } : {}),
  ...(r.bold ? { bold: true } : {}),
  ...(r.dim ? { dimColor: true } : {}),
  ...(r.inverse ? { inverse: true } : {}),
})

export function registerBand(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    markBand($)
    if (e.props.hasSurvey) return next(e)
    const runs = await bandRuns($, e.props.bodyColumns)
    if (!runs) return next(e)
    const { Text } = $.ui.resolve(e)
    return Text({ wrap: 'truncate-end', children: runs.map(r => Text({ ...propsOf(r), children: r.text })) })
  }).catch(($, e, next) => next(e))
}
