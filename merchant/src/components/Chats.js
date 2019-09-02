import React from 'react'
import { Divider } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { lightGreen } from '@material-ui/core/colors'
import EditorAttachFile from '@material-ui/icons/AttachFile'
import Linkify from 'react-linkify'

import UserAvatar from 'components/UserAvatar'
import BookingChat from 'components/BookingChat'
import MediaSlider from 'components/MediaSlider'
import ReadMore from 'components/ReadMore'
import PriceBreakdown from 'components/PriceBreakdown'
import { shortTimeString } from 'lib/date'
import { imageSizes } from '@smooosy/config'

@withWidth()
@withTheme
export default class Chats extends React.Component {
  static defaultProps = {
    onIconClick: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {
      slideNumber: null,
    }
  }

  componentDidMount() {
    if (!this.root) return
    const parent = this.root.parentNode

    if (this.unreadChatRef) {
      parent.scrollTop = this.unreadChatRef.offsetTop + 30
    } else {
      parent.scrollTop = parent.scrollHeight
    }
  }

  showImage = chat => {
    const { chats } = this.props
    let slideNumber
    chats.filter(c => c.type === 'image').map((c, i) => {
      if (c.id === chat.id) slideNumber = i
    })
    this.setState({slideNumber})
  }

  render() {
    const { slideNumber } = this.state
    const { style, chats, me, trim, priceString, unreadline, meet, width, theme, onIconClick } = this.props
    const unreadChat = unreadline ? chats.find(c => !c.read) : null

    const { grey, secondary } = theme.palette

    const styles = {
      avatar: {
        width: 36,
        height: 36,
        minWidth: 36,
        minHeight: 36,
      },
      time: {
        textAlign: 'center',
        fontSize: 12,
        color: grey[500],
        margin: 5,
      },
      chat: {
        position: 'relative',
        display: 'flex',
      },
      systemMessage: {
        textAlign: 'center',
        color: grey[500],
        padding: 5,
        wordBreak: 'break-all',
        fontSize: 12,
      },
      chatBallon: {
        position: 'relative',
        background: grey[200],
        minWidth: '40%',
        margin: '0 5px 0 20px',
        borderRadius: 8,
        padding: 8,
      },
      chatBallonBefore: {
        position: 'absolute',
        display: 'block',
        top: 10,
        left: -24,
        borderStyle: 'solid',
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderColor: `transparent ${grey[200]} transparent transparent`,
      },
      text: {
        height: '100%',
        fontSize: 14,
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      },
      image: {
        margin: '0 10px',
        borderRadius: 12,
        minWidth: 80,
        minHeight: 80,
        maxWidth: '100%',
        background: grey[200],
        cursor: 'pointer',
      },
      audio: {
        margin: '5px 10px',
        maxWidth: 220,
      },
      file: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
        margin: '0 10px',
        borderRadius: 12,
        cursor: 'pointer',
        color: grey[800],
        border: `5px solid ${grey[500]}`,
      },
      read: {
        minWidth: 24,
        fontSize: 11,
        color: grey[500],
      },
      unreadLine: {
        textAlign: 'center',
        marginTop: 6,
        color: secondary.main,
      },
      unreadLineText: {
        fontSize: 12,
        marginTop: 6,
        marginBottom: 16,
      },
      readmore: {
        background: grey[200],
        boxShadow: `-20px 0px 20px 0px ${grey[200]}`,
      },
    }

    const mineStyles = {
      chat: {
        ...styles.chat,
        flexDirection: 'row-reverse',
      },
      chatBallon: {
        ...styles.chatBallon,
        margin: '0 20px 0 5px',
        background: lightGreen[100],
      },
      chatBallonBefore: {
        ...styles.chatBallonBefore,
        left: 'auto',
        right: -24,
        borderColor: `transparent transparent transparent ${lightGreen[100]}`,
      },
      readmore: {
        background: lightGreen[100],
        boxShadow: `-20px 0px 20px 0px ${lightGreen[100]}`,
      },
    }

    let prevDate = 0
    return (
      <div ref={(e) => this.root = e} style={style || {}}>
        {chats.map((chat, idx) => {
          const showTime = new Date(chat.createdAt) - prevDate > 600000
          prevDate = new Date(chat.createdAt)
          if (chat.system) {
            return (
              <div key={idx} style={{margin: width === 'xs' ? '10px 0' : '20px 0'}}>
                {showTime && <div style={styles.time}>{shortTimeString(new Date(chat.createdAt))}</div>}
                <div style={{margin: '5px 10%', display: 'flex', alignItems: 'center'}}>
                  <div style={{borderBottom: `1px solid ${grey[400]}`, height: 1, flex: 1}} />
                  <div style={styles.systemMessage}>{chat.text}</div>
                  <div style={{borderBottom: `1px solid ${grey[400]}`, height: 1, flex: 1}} />
                </div>
              </div>
            )
          }

          const mine = me ? chat.user.id === me.id : chat.pro

          return (
            <div ref={chatRef => {
              if (!chat.read && !mine && !this.unreadChatRef) {
                this.unreadChatRef = chatRef
              }
            }} key={idx} style={{margin: width === 'xs' ? '10px 0' : '20px 0'}}>
              {unreadChat && unreadChat.id === chat.id && !mine &&
                <div style={styles.unreadLine}>
                  <Divider style={{backgroundColor: secondary.main}} />
                  <p style={styles.unreadLineText}>新しいメッセージ</p>
                </div>
              }
              {showTime && <div style={styles.time}>{shortTimeString(new Date(chat.createdAt))}</div>}
              <div style={mine ? mineStyles.chat : styles.chat}>
                <div style={{...styles.avatar, cursor: (width !== 'md' && !mine) && 'pointer'}} onClick={mine ? () => {} : onIconClick}>
                  <UserAvatar user={chat.user} me={me} style={styles.avatar} suspend={meet && meet.profile.suspend} />
                </div>
                <div style={{maxWidth: '80%', flex: 1, display: 'flex', alignItems: 'flex-end', flexDirection: mine ? 'row-reverse': 'row'}}>
                  {chat.type === 'image' ?
                    <img style={styles.image} src={chat.url + imageSizes.r320} onClick={() => this.showImage(chat)} />
                  : chat.type === 'audio' ?
                    <audio style={styles.audio} src={chat.url} controls={true} />
                  : ['file', 'invoice'].includes(chat.type) ?
                    <a style={styles.file} href={chat.url} target='_blank' rel='noopener noreferrer'>
                      <EditorAttachFile style={{color: grey[800]}} />
                      <p style={{fontWeight: 'bold', textTransform: 'uppercase'}}>{chat.type === 'invoice' ? '請求書' : chat.ext}</p>
                    </a>
                  : chat.type === 'booking' ?
                    <BookingChat action={chat.booking.action} schedule={chat.booking.schedule} me={me} />
                  : chat.type === 'price' ?
                    meet && meet.priceValues && meet.priceValues.total > 0 ?
                      <div style={mine ? mineStyles.chatBallon : styles.chatBallon}>
                        <div style={mine ? mineStyles.chatBallonBefore : styles.chatBallonBefore} />
                        <div style={styles.text}>
                          <PriceBreakdown price={meet.priceValues} />
                        </div>
                      </div>
                      :
                      <div style={mine ? mineStyles.chatBallon : styles.chatBallon}>
                        <div style={mine ? mineStyles.chatBallonBefore : styles.chatBallonBefore} />
                        <div style={{fontSize: 24}}>価格未定</div>
                      </div>
                  :
                    <div style={mine ? mineStyles.chatBallon : styles.chatBallon}>
                      <div style={mine ? mineStyles.chatBallonBefore : styles.chatBallonBefore} />
                      <div style={styles.text}>
                        {idx === 0 && priceString && <div style={{fontWeight: 'bold', marginBottom: 10}}>{priceString}</div>}
                        {trim ?
                          <ReadMore name={chat.id} toggleStyle={mine ? mineStyles.readmore : styles.readmore}>
                            <Linkify properties={{target: '_blank', rel: 'nofollow'}}>{chat.text}</Linkify>
                          </ReadMore>
                        :
                          <Linkify properties={{target: '_blank', rel: 'nofollow'}}>{chat.text}</Linkify>
                        }
                      </div>
                    </div>
                  }
                  {chat.read && (chat.type !== 'price' || me.pro) && <div style={styles.read}>既読</div>}
                </div>
              </div>
              {idx === 0 && !mine && meet && <BookingChat action='new' meet={meet} />}
            </div>
          )
        })}
        <MediaSlider media={chats.filter(c => c.type === 'image')} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} content={(_, i) => <div>{i+1} of {chats.filter(c => c.type === 'image').length}</div>} />
      </div>
    )
  }
}
