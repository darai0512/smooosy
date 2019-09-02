import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { load, update } from 'modules/profile'
import { Avatar, Button } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import ContentAdd from '@material-ui/icons/Add'
import withWidth from '@material-ui/core/withWidth'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import Chats from 'components/Chats'
import ConfirmDialog from 'components/ConfirmDialog'
import { priceFormat } from 'lib/string'

@withWidth({withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
  }),
  { load, update }
)
export default class TemplateList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      deleteIndex: false,
    }
  }

  componentDidMount() {
    this.props.load(this.props.match.params.id)
  }

  handleDelete = (i) => {
    const templates = [...this.props.profile.templates]
    templates.splice(i, 1)
    this.props.update(this.props.profile.id, {templates})
    this.setState({deleteIndex: false})
  }

  render() {
    const { user, profile, match, history, width, theme } = this.props
    const { common, grey } = theme.palette

    if (!profile) return null

    const styles = {
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'stretch',
      },
      template: {
        width: 300,
        minHeight: 260,
        margin: 10,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        background: common.white,
        border: `1px solid ${grey[300]}`,
      },
      dummyTemplate: {
        width: 300,
        margin: '0 10px',
        padding: '0 10px',
      },
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} >
                    <NavigationChevronLeft />
                  </Button>
                </Link>
              }
            </div>
            <div>返信定型文一覧</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <div style={styles.main}>
          {profile.templates.map((t, index) =>
            <div key={`template_${t._id}_${index}`} style={styles.template}>
              <h4>{t.title}</h4>
              <Chats trim me={user} chats={[{id: t.id, text: t.chat, user}]} priceString={priceFormat(t)} />
              <div style={{flex: 1}} />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Button onClick={() => this.setState({deleteIndex: index})} >削除</Button>
              <Button variant='contained' color='primary' onClick={() => history.push(`/account/templates/${match.params.id}/edit/${index}`)}>編集</Button>
              </div>
            </div>
          )}
          <div style={{...styles.template, justifyContent: 'center', alignItems: 'center'}} onClick={() => history.push(`/account/templates/${match.params.id}/edit/${profile.templates.length}`)}>
            <Avatar alt='追加' style={{width: 60, height: 60}}><ContentAdd /></Avatar>
          </div>
          {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummyTemplate} />)}
        </div>
        <ConfirmDialog
          open={this.state.deleteIndex !== false}
          title='削除しますか？'
          label='削除'
          onClose={() => this.setState({deleteIndex: false})}
          onSubmit={() => this.handleDelete(this.state.deleteIndex)}
        />
      </AutohideHeaderContainer>
    )
  }
}
