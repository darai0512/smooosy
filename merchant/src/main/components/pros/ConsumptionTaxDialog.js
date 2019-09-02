import React from 'react'
import { connect } from 'react-redux'
import { DialogContent, DialogTitle, Dialog, withStyles, ListItem } from '@material-ui/core'
import DownArrowIcon from '@material-ui/icons/ArrowDownward'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import { red, yellow } from '@material-ui/core/colors'

import { getBoolValue } from 'lib/runtimeConfig'

@withStyles(theme => ({
  dialog: {
    color: theme.palette.grey[900],
  },
  priceTable: {
    marginTop: 30,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(2.5),
  },
  price: {
    fontWeight: 'bold',
    marginLeft: 5,
    [theme.breakpoints.down('xs')]: {
      margin: 0,
    },
  },
  row: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
}))
@connect(state => ({
  showTaxChange: getBoolValue(
    'showTaxChange',
    state.runtimeConfig.runtimeConfigs,
  ),
}))
export default class ConsumptionTaxDialog extends React.Component {
  state = {
    open: false,
  }

  onClose = () => this.setState({open: false})
  onOpen = () => this.setState({open: true})

  render() {
    const { children, classes, showTaxChange } = this.props
    const { open } = this.state

    if (!showTaxChange) return null

    return (
      <>
        {children && children({onOpen: this.onOpen, onClose: this.onClose})}
        <Dialog open={open} onClose={this.onClose} className={classes.dialog}>
          <DialogTitle>消費税率変更に伴うご案内</DialogTitle>
          <DialogContent>
            <div className={classes.text}>
              2019年10月1日より消費税率が10%に引き上げられることに伴い、SMOOOSYポイントの税込価格が下記の通り変更されます。
            </div>
            <div className={classes.priceTable}>
              <div className={classes.rows}>
                <div className={classes.row}>
                  2019年9月30日までの購入分は<div className={classes.price}>税込162円（税抜き150円）</div>
                </div>
                <DownArrowIcon />
                <div className={classes.row}>
                  2019年10月1日以降の購入分は<div className={classes.price}>税込165円（税抜き150円）</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
}


export const ListItemNotice = withStyles(theme => ({
  adminNotice: {
    background: yellow[50],
    padding: '8px 16px',
    color: theme.palette.common.black,
  },
  notice: {
    width: '100%',
    maxWidth: 300,
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'pre-wrap',
  },
  title: {
    fontWeight: 'bold',
  },
})
)(({classes}) => {
  return (
    <ConsumptionTaxDialog>
      {({onOpen}) => (
        <ListItem button divider dense className={classes.adminNotice} onClick={onOpen}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%'}}>
            <InfoIcon style={{marginRight: 10, color: red[500]}} />
            <div className={classes.notice}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 5}}>
                <p className={classes.title}>消費税率変更に伴うポイント価格変更</p>
                <p className={classes.title}>[運営]</p>
              </div>
              <p>10月1日(火)に消費税率が10%になることに伴い、SMOOOSYポイントの税込価格が165円（現在：162円）に変更になります</p>
            </div>
          </div>
        </ListItem>
      )}
    </ConsumptionTaxDialog>
  )
})
