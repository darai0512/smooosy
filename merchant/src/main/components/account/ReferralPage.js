import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Badge, Avatar } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withStyles } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationCheck from '@material-ui/icons/Check'
import EmailIcon from '@material-ui/icons/Email'

import { load, referUsers } from 'modules/auth'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import UserAvatar from 'components/UserAvatar'
import { webOrigin } from '@smooosy/config'

@withWidth()
@withStyles(() => ({
  badge: {
    padding: 0,
  },
}), { withTheme: true })
@connect(
  state => ({
    user: state.auth.user,
    refers: state.auth.refers,
  }),
  { load, referUsers }
)
export default class ReferralPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.load()
    this.props.referUsers()
  }

  render() {
    const { user, refers, classes, width, theme } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        height: '100%',
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
        padding: 20,
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: width === 'xs' ? 'initial': 640,
        margin: '30px auto',
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
      },
      subheader: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: '10px 0',
      },
      link: {
        display: 'inline-block',
        maxWidth: '80vw',
        padding: 10,
        borderRadius: 4,
        fontSize: width === 'xs' ? 12 : 14,
        border: `1px solid ${grey[500]}`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      shareButton: {
        width: 50,
        height: 50,
        margin: 5,
      },
    }

    const url = `${webOrigin}/pro?refer=${user.shortId}`

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} >{<NavigationChevronLeft />}</Button>
                </Link>
              }
            </div>
            <div>プロの友達を紹介する</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>プロの友達を紹介</title>
        </Helmet>
        <div style={styles.main}>
          <div style={styles.subheader}>プロを招待してSMOOOSYポイントをゲットしよう</div>
          <div>
            あなたの招待リンクで友達がプロ登録して、初めての応募をすると
            <a onClick={() => this.props.history.push('/account/points', {campaign: true})}>8ポイントをプレゼント</a>
            します！
            もちろん違う業種でも大丈夫です。
          </div>
          <div style={{margin: '20px 0'}}>
            <p style={{fontSize: 12}}>あなたの招待リンク:</p>
            <p style={styles.link}>{url}</p>
          </div>
          <div style={{display: 'flex', marginTop: 10}}>
            <a href={`mailto:?subject=SMOOOSYの友達紹介&body=${encodeURIComponent('SMOOOSYでプロ登録すると無料で仕事依頼を受け取れます。\nこのリンクから登録してみてください。\n'+url)}`} target='_blank' rel='noopener noreferrer'>
              <Avatar style={styles.shareButton}><EmailIcon /></Avatar>
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('SMOOOSYでプロ登録すると無料で仕事依頼を受け取れます。\nこのリンクから登録してみてください。\n'+url)}`} target='_blank' rel='noopener noreferrer'>
              <img style={styles.shareButton} src='/images/social_twitter.png' />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target='_blank' rel='noopener noreferrer'>
              <img style={styles.shareButton} src='/images/social_facebook.png' />
            </a>
          </div>
          <div style={{fontSize: 12}}>※各サービスの投稿画面を開きます</div>
          <div style={{marginTop: 20}}>
            <div style={{fontWeight: 'bold'}}>あなたの紹介で登録したプロ</div>
            <div style={{display: 'flex', flexWrap: 'wrap'}}>
              {refers.length ? refers.map(ref =>
                <div key={ref.id} style={{position: 'relative', margin: 5}} title={`${ref.lastname}様`}>
                  {ref.refer.sendMeet ?
                    <Badge classes={{badge: classes.badge}} badgeContent={<NavigationCheck style={{color: common.white}} />} color='secondary'>
                      <UserAvatar user={ref} style={{width: 60, height: 60}} />
                    </Badge>
                  :
                    <UserAvatar user={ref} style={{width: 60, height: 60}} />
                  }
                </div>
              )
              :
                'なし'
              }
            </div>
          </div>
        </div>
      </AutohideHeaderContainer>
    )
  }
}
