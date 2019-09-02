import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'

@withStyles(theme => ({
  input: {
    width: '100%',
    padding: '8px 16px',
    fontSize: 16,
    outline: 'none',
    border: `1px solid ${theme.palette.grey[300]}`,
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
}))
export default class Prompt extends React.Component {
  constructor(props) {
    super(props)
    this.state = {value: ''}
  }

  handleAction = (event, callback) => {
    event.preventDefault()
    event.stopPropagation()
    callback && callback(this.state.value)
    this.setState({value: ''})
  }

  render() {
    const { title, onClose, onSubmit, classes, ...custom } = this.props

    return (
      <Dialog onClose={onClose} {...custom}>
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={(event) => this.handleAction(event, onSubmit)}>
          <DialogContent>
            <input
              type='text'
              autoFocus={true}
              className={classes.input}
              value={this.state.value}
              onChange={(event) => this.setState({value: event.target.value})} />
          </DialogContent>
          <DialogActions>
            <Button onClick={(event) => this.handleAction(event, onClose)}>キャンセル</Button>
            <Button variant='contained' color='primary' type='submit'>OK</Button>
          </DialogActions>
        </form>
      </Dialog>
    )
  }
}
