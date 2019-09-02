import React from 'react'
import { Table, TableBody } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import CheckIcon from '@material-ui/icons/Check'

import CustomRow from 'components/CustomRow'
import { imageSizes } from '@smooosy/config'

const RequestPaper = ({request, noName, style, classes}) => {
  let customer = []
  if (request.address) customer.push(request.address)
  if (!noName) customer.push(`${request.customer}様`)
  customer = customer.join('の')

  return (
    <div className={classes.paper} style={style}>
      <h3 className={classes.title}>
        <div className={classes.name}>{request.service.name}を探しています</div>
        {!!customer && <div className={classes.customer}>{customer}</div>}
      </h3>
      <Table className={classes.table}>
        <TableBody>
          {request.description.filter(d => d.answers.filter(a => a.text || a.image).length).map((desc, i) =>
            <CustomRow key={i} title={desc.label}>
              {desc.answers.map(a =>
                <div key={a._id} className={classes.answer}>
                  <CheckIcon classes={{root: classes.answerCheck}} />
                  <span>{a.text}</span>
                  {a.image && <img alt={a.text} src={a.image + imageSizes.c80} className={classes.answerImg} width='60' height='60' />}
                </div>
              )}
            </CustomRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default withStyles(theme => ({
  paper: {
    margin: '20px auto',
    maxWidth: 700,
    padding: 20,
    borderColor: theme.palette.grey[300],
    borderStyle: 'solid',
    borderWidth: 1,
    background: theme.palette.common.white,
    [theme.breakpoints.down('xs')]: {
      padding: '10px 0',
      borderWidth: '1px 0',
    },
  },
  title: {
    textAlign: 'center',
    margin: '10px 10px 40px',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  customer: {
    margin: 5,
  },
  table: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  answer: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
  },
  answerCheck: {
    minWidth: 24,
    marginRight: 10,
    color: theme.palette.secondary.main,
  },
  answerImg: {
    height: 60,
    width: 60,
    margin: '1px 8px',
  },
}))(RequestPaper)
