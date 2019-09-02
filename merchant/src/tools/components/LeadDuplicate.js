import React from 'react'
import { connect } from 'react-redux'

import { AppBar, Button, Dialog, DialogContent, IconButton, Toolbar, Typography } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import ConfirmDialog from 'components/ConfirmDialog'
import MemoList from 'tools/components/MemoList'
import { ConvertDialog, LeadForm } from 'tools/components/LeadDialog'

import { update as updateError, load } from 'tools/modules/lead'

@connect(
  () => ({}),
  { updateError, load }
)
export default class LeadDuplicate extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      notDuplicated: [],
    }
  }

  approveSubmit = () => {
    const { leadForSave } = this.state
    this.props.update([leadForSave])
    this.props.remove(this.props.leads.filter(l => l._id !== leadForSave._id))
    this.setState({submit: false, leadForSave: null})
  }

  handleSubmit = lead => {
    this.setState({submit: true, leadForSave: lead})
  }

  handleNotDuplicate = id => {
    const { notDuplicated } = this.state
    this.props.updateError([{_id: id, notDuplicate: true}])
      .then(() => {
        this.setState({
          notDuplicated: notDuplicated.concat(id),
        })
      })
  }

  render() {
    const { leads, open, onClose } = this.props
    const { notDuplicated, convert } = this.state

    if (!leads || !leads.length) return null

    return (
      <Dialog open={!!open} onClose={onClose} fullScreen>
        <AppBar position='static'>
          <Toolbar>
            <Typography variant='h6' color='inherit' style={{flex: 1}}>
              LEAD編集
            </Typography>
            <IconButton color='inherit' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <div style={{display: 'flex', margin: '10px 0'}}>
            {leads.filter(l => !notDuplicated.includes(l._id)).map((l, idx, filtered) => (
              <div key={l._id} style={{flex: 1, minWidth: idx ? 350 : 500, marginRight: 10}}>
                <Button variant='contained' size='small' style={{margin: '0 5px'}} color='secondary' onClick={() => this.setState({convert: l._id})}>文字化け修正</Button>
                {filtered.length > 1 ?
                  <Button variant='contained' size='small' style={{margin: '0 5px'}} onClick={() => this.handleNotDuplicate(l._id)}>重複ではない</Button>
                :
                  <Button variant='contained' size='small' style={{margin: '0 5px'}} onClick={() => this.setState({remove: true})}>削除</Button>
                }
                <LeadForm index={idx} key={l._id} form={`lead_${l._id}`} initialValues={l} onSubmit={this.handleSubmit} multi={filtered.length > 1} />
                <div style={{marginTop: 10}}>
                  <MemoList form={`memo_${l._id}`} lead={l._id} />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        {convert && <ConvertDialog lead={leads.find(l => l._id === convert)} open={!!convert} onClose={() => this.setState({convert: null})} />}
        <ConfirmDialog open={!!this.state.remove} title='削除しますか？' onClose={() => this.setState({remove: null})} onSubmit={this.onRemove} />
        <ConfirmDialog open={!!this.state.submit} title='更新しますか？' onClose={() => this.setState({submit: false})} onSubmit={this.approveSubmit} />
      </Dialog>
    )
  }
}
