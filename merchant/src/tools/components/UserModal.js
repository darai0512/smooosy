import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Dialog, Table, TableBody } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import CustomRow from 'components/CustomRow'
import TelLink from 'components/TelLink'
import ProStat from 'tools/components/ProStat'

@withApiClient
@connect(
  state => ({
    admin: state.auth.admin,
  })
)
@withStyles(theme => ({
  title: {
    fontSize: '1.3em',
    fontWeight: 'bold',
    padding: 10,
    background: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  bounce: {
    color: theme.palette.red[500],
  },
  dialogPaper: {
    overflowY: 'auto',
    width: '90vw',
  },
}))
export default class UserModal extends React.Component {
  state = {}

  componentDidUpdate() {
    // To reduce unused API call, load when dialog open
    if (this.props.open && !this.state.user) {
      this.load()
    }
  }

  load = () => {
    this.props.apiClient
      .get(`/api/admin/users/${this.props.user.id}`)
      .then(res => res.data)
      .then(user => this.setState({user}))
  }

  render() {
    const { admin, open, onClose } = this.props
    const { user } = this.state

    if (!user) {
      return null
    }

    return (
      <Dialog
        open={!!open}
        onClose={onClose}
        classes={{
          paper: this.props.classes.dialogPaper,
        }}
      >
        <div className={this.props.classes.title}>基本情報</div>
        <Table style={{overflow: 'visible'}}>
          <TableBody>
            <CustomRow title='名前'>{user.lastname} {user.firstname}</CustomRow>
            <CustomRow title='最終アクセス'>{new Date(user.lastAccessedAt).toLocaleString()}</CustomRow>
            <CustomRow title='プロ'>
              {user.pro ? user.profiles.map(p =>
                <div key={p.id || p}>・<Link to={`/stats/pros/${p.id || p}`}>{p.name}</Link></div>
              ) : 'NO'}
            </CustomRow>
            {admin > 1 &&
              <CustomRow title='メール'>
                <a href={`mailto:${user.email}`}>{user.email}</a> {user.bounce && <span className={this.props.classes.bounce}>バウンス</span>}
              </CustomRow>
            }
            {admin > 1 && <CustomRow title='電話番号'><TelLink phone={user.phone} /></CustomRow>}
            <CustomRow title='連携'>
              <p>LINE: {user.lineId ? 'YES': 'NO'}</p>
              <p>Google: {user.googleId ? 'YES': 'NO'}</p>
              <p>Facebook: {user.facebookId ? 'YES': 'NO'}</p>
            </CustomRow>
          </TableBody>
        </Table>
        {user.stat &&
          <div>
            <div className={this.props.classes.title}>プロ統計情報</div>
            <ProStat stat={user.stat} />
          </div>
        }
        {user.requests && user.requests.length > 0 &&
          <div>
            <div className={this.props.classes.title}>出した依頼</div>
            <Table style={{overflow: 'visible'}}>
              <TableBody>
                {user.requests.map(r =>
                  <CustomRow key={r.id} title={new Date(r.createdAt).toLocaleString()}>
                    <Link to={`/stats/requests/${r.id}`}>{r.service.name} {r.address}</Link>
                  </CustomRow>
                )}
              </TableBody>
            </Table>
          </div>
        }
      </Dialog>
    )
  }
}
