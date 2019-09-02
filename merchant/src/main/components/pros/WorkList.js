import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { loadAllForPro as loadMeets } from 'modules/meet'
import { List, ListItem, ListItemText } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CustomChip from 'components/CustomChip'
import { priceFormat } from 'lib/string'

@connect(
  state => ({
    meets: state.meet.meets,
  }),
  { loadMeets }
)
@withTheme
export default class WorkList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loadMeets({status: this.props.status})
  }

  componentDidUpdate(prevProps) {
    this.props.status !== prevProps.status && this.props.loadMeets({status: this.props.status})
  }

  render() {
    const { status, id, meets, theme } = this.props

    const { common, grey, primary, red } = theme.palette

    if (!meets) return null

    const styles = {
      root: {
        flex: 1,
        WebkitOverflowScrolling: 'touch',
        overflowY: 'auto',
      },
      date: {
        float: 'right',
      },
      listItemText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    }

    const chipForMeet = meet => (
      meet.review ?
        <CustomChip style={{marginRight: 10, color: common.white, background: grey[700]}} label='完了' />
      : meet.status === 'done' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: primary.main}} label='クチコミ待ち' />
      : meet.status === 'exclude' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: grey[500]}} label='候補外' />
      : meet.request.status === 'suspend' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: grey[500]}} label='キャンセル' />
      : meet.request.status === 'close' && meet.status === 'waiting' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: grey[500]}} label='終了' />
      : meet.proResponseStatus === 'autoAccept' && !meet.chats.some((c, i) => i > 0 && c.user.id === meet.pro) ?
        <CustomChip style={{marginRight: 10, color: common.white, background: red[500]}} label='新規ご指名' />
      : meet.chats.filter(c => c.user.id === meet.customer.id && !c.system && !c.read).length ?
        <CustomChip style={{marginRight: 10, color: common.white, background: red[500]}} label='要確認' />
      : meet.status === 'progress' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: primary.main}} label='成約' />
      : meet.chatStatus === 'responded' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: primary.main}} label='交渉中' />
      : meet.chatStatus === 'read' ?
        <CustomChip style={{marginRight: 10, color: common.white, background: primary.main}} label='既読' />
      : meet.displayPhone ?
        <CustomChip style={{marginRight: 10, color: common.white, background: primary.main}} label='電話表示済' />
      :
        <CustomChip style={{marginRight: 10, color: common.white, background: grey[700]}} label='未読' />
    )

    return (
      <div style={styles.root}>
        <List style={{padding: 0}}>
          {meets.map(meet => (
            <ListItem button divider selected={meet.id === id} key={meet.id} component={Link} to={`/pros/${status}/${meet.id}`} style={{height: 'auto'}}>
              <ListItemText
                style={{width: '100%'}}
                disableTypography={true}
                primary={
                  <div style={styles.listItemText}>
                    {meet.customer.lastname}様
                    <span style={styles.date}>{meet.priceType === 'needMoreInfo' ? '価格未確定' : priceFormat(meet)}</span>
                  </div>
                }
                secondary={
                  <div style={styles.listItemText}>
                    {chipForMeet(meet)}
                    <span style={{fontSize: 12}}>{meet.service.name}</span>
                  </div>
                }
              />
            </ListItem>
          ))}
        </List>
      </div>
    )
  }
}
