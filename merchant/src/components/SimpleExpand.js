import React from 'react'
import { ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

let SimpleExpand = ({header, defaultExpanded, children, classes}) => (
  <ExpansionPanel defaultExpanded={defaultExpanded}>
    <ExpansionPanelSummary
      expandIcon={<ExpandMoreIcon />}
      classes={{root: classes.summaryRoot, content: classes.summaryContent, expanded: classes.expanded}}
    >
      {header}
    </ExpansionPanelSummary>
    <ExpansionPanelDetails classes={{root: classes.detail}}>
      {children}
    </ExpansionPanelDetails>
  </ExpansionPanel>
)

SimpleExpand = withStyles({
  summaryRoot: {
    minHeight: 48,
    '&$expanded': {
      minHeight: 48,
    },
  },
  summaryContent: {
    '&$expanded': {
      margin: '12px 0',
    },
  },
  expanded: {},
  detail: {
    padding: 10,
    display: 'block',
  },
})(SimpleExpand)

export default SimpleExpand
