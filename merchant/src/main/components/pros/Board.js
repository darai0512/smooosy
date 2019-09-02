import React from 'react'
import { Tabs, Tab } from '@material-ui/core'
import { withTheme, withStyles } from '@material-ui/core/styles'
import { cyan, blueGrey, brown } from '@material-ui/core/colors'
import ActionQuestionAnswer from '@material-ui/icons/QuestionAnswer'
import CommunicationChatBubble from '@material-ui/icons/ChatBubble'
import ActionCheckCircle from '@material-ui/icons/CheckCircle'
import DeleteIcon from '@material-ui/icons/Delete'
import withWidth from '@material-ui/core/withWidth'
import RequestPage from 'components/pros/RequestPage'
import WorkList from 'components/pros/WorkList'
import WorkPageLoader from 'components/pros/WorkPageLoader'
import PhoneModal from 'components/pros/PhoneModal'
import ProOnBoarding from 'components/pros/ProOnBoarding'
// import InvoicePage from 'components/account/InvoicePage'

@withWidth()
@withTheme
@withStyles({
  tabLabel: {
    width: '20%',
    minWidth: 'auto',
    height: 60,
    padding: 0,
  },
})
export default class Board extends React.PureComponent {

  render() {
    const { history, classes, width, theme, match: { params } } = this.props
    const tab = params.tab || 'requests'
    const id = params.id

    const { grey, secondary } = theme.palette

    const styles = {
      dashboard: {
        height: '100%',
        width: '100%',
        display: 'flex',
        paddingTop: 60,
      },
      list: {
        height: '100%',
        width: (!id && width === 'xs') ? '100%' : 300,
        display: (id && width === 'xs') ? 'none' : 'flex',
        flexDirection: 'column',
        background: grey[50],
        borderRight: (!id && width === 'xs') ? 'none' : `1px solid ${grey[300]}`,
      },
      tabs: {
        background: grey[50],
        borderBottom: `1px solid ${grey[300]}`,
      },
      content: {
        height: '100%',
        flex: 1,
        position: 'relative',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }

    let listComponent, children
    if (tab === 'requests') { // 新依頼一覧へ移行
      children = id ? <RequestPage id={id} /> : null
    } else if (tab === 'contacts') {
      children = id ? <WorkPageLoader key={tab} status={tab} id={id} /> : null
    } else {
      listComponent = <WorkList key={tab} status={tab} id={id} />
      // if (/\/invoice$/.test(location.pathname)) {
      //   children = id ? <InvoicePage id={id} /> : null
      // } else {
      children = id ? <WorkPageLoader key={tab} status={tab} id={id} /> : null
      // }
    }

    return (
      <div style={styles.dashboard}>
        <style>{'body {overflow: hidden;}'}</style>
        {!!listComponent &&
        <div style={styles.list}>
          <Tabs
            variant='fullWidth'
            value={tab}
            indicatorColor='secondary'
            onChange={(e, tab) => history.push(`/pros/${tab}`)}
            style={styles.tabs}
          >
            <Tab className={classes.tabLabel} value='waiting' icon={<CommunicationChatBubble style={{color: brown[500]}} />} label='見積済' />
            <Tab className={classes.tabLabel} value='talking' icon={<ActionQuestionAnswer style={{color: cyan[600]}} />} label='交渉中' />
            <Tab className={classes.tabLabel} value='hired' icon={<ActionCheckCircle style={{color: secondary.main}} />} label='成約' />
            <Tab className={classes.tabLabel} value='archive' icon={<DeleteIcon style={{color: blueGrey[600]}} />} label='ゴミ箱' />
          </Tabs>
          {listComponent}
        </div>
        }
        <div style={styles.content}>
          {children}
        </div>
        <PhoneModal />
        <ProOnBoarding />
      </div>
    )
  }
}
