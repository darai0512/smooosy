import React from 'react'
import { connect } from 'react-redux'
import { Dialog } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { green } from '@material-ui/core/colors'

import { withApiClient } from 'contexts/apiClient'
import Loading from 'components/Loading'
import MemoList from 'tools/components/MemoList'

@withApiClient
@connect(state => ({
  logs: state.maillog.maillogs,
}), {})
@withStyles({
  emailDialogPaper: {
    maxWidth: 600,
    padding: 20,
  },
}, {withTheme: true})
export default class MailLogs extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loader(this.props.loadProps)
      .then(() => this.setState({loaded: true}))
  }

  showMail = (e, mail) => {
    e.preventDefault()
    this.setState({emailPreview: true})
    this.props.apiClient.get(`/api/admin/mailLog/${mail.html}`)
      .then(res => res.data[0])
      .then(emailHtml => this.setState({emailHtml: emailHtml || null}))
  }

  render() {
    const { logs, title, classes, theme, userInfo } = this.props
    const { emailPreview, emailHtml, loaded } = this.state
    const { grey, red } = theme.palette

    if (loaded && (!logs || logs.length === 0)) {
      return <div>送信されたメールはありません</div>
    }

    return (
      <div>
        {logs.map(mail =>
          <div key={mail.id}>
            {userInfo ?
              <details>
                <summary style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{ color: green[500], fontWeight: 'bold', marginRight: 4 }}>
                    {new Date(mail.createdAt).toLocaleString()}
                  </span>
                  <span style={{margin: '0 4px', color: mail.open ? red[500] : grey[300]}}>open</span>
                  <span style={{margin: '0 4px', color: mail.click ? red[500] : grey[300]}}>click</span>
                  <a onClick={e => this.showMail(e, mail)}>
                    {
                      title === 'subject' ? mail.subject :
                      title === 'address' ? mail.address :
                      `${mail.subject} ${mail.address}`
                    }
                  </a>
                  <span style={{margin: '0 4px'}}>{mail.name}</span>
                  <span style={{margin: '0 4px'}}>{mail.phone}</span>
                </summary>
                <MemoList style={{marginBottom: 20}} form={`memo_${mail.leadId}`} lead={mail.leadId}/>
              </details>
            :
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{ color: green[500], fontWeight: 'bold', marginRight: 4 }}>
                  {new Date(mail.createdAt).toLocaleString()}
                </span>
                <span style={{margin: '0 4px', color: mail.open ? red[500] : grey[300]}}>open</span>
                <span style={{margin: '0 4px', color: mail.click ? red[500] : grey[300]}}>click</span>
                <a onClick={e => this.showMail(e, mail)}>
                  {
                    title === 'subject' ? mail.subject :
                    title === 'address' ? mail.address :
                    `${mail.subject} ${mail.address}`
                  }
                </a>
              </div>
            }
          </div>
        )}
        <Dialog
          open={!!emailPreview}
          onClose={() => this.setState({emailPreview: false, emailHtml: undefined})}
          classes={{paper: classes.emailDialogPaper}}
        >
          {emailHtml ?
            <div dangerouslySetInnerHTML={{__html: emailHtml.html}} />
          : emailHtml === null ?
            <div style={{padding: 50}}>取得失敗</div>
          :
            <Loading style={{padding: 50}} />
          }
        </Dialog>
      </div>
    )
  }
}
