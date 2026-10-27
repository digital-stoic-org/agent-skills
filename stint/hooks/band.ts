import type { On } from 'claude-code'

import { bandRuns, markBand, pressPit } from './dash.ts'
import type { Run } from './dash.ts'

// The AbovePrompt band: the dash runs, then the `[ pit ]` button. Raised on terminal and desktop only; its Button hotkeys work while the band has focus.

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
    const { Box, Button, Text } = $.ui.resolve(e)
    return Box({
      flexDirection: 'row',
      children: [
        Text({ wrap: 'truncate-end', children: runs.map(r => Text({ ...propsOf(r), children: r.text })) }),
        Text({ children: '   ' }),
        Button({ key: 'pit', label: '[ pit ]', hotkey: 'g', onPress: () => pressPit($) }),
      ],
    })
  }).catch(($, e, next) => next(e))
}
