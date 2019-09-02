import React from 'react'
import { connect } from 'react-redux'
import { loadAll } from 'modules/profile'
import { Dialog, List, ListItem } from '@material-ui/core'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
    profiles: state.profile.profiles,
  }),
  { loadAll }
)
@withTheme
export default class ProfileSelect extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { user } = this.props
    if (user.profiles.length === 1) {
      const id = user.profiles[0].id || user.profiles[0]
      this.redirect({ id })
    } else {
      this.props.loadAll()
        .then(res => res.profiles)
        .then(profiles => {
          if (profiles.length === 1) {
            const id = profiles[0].id || profiles[0]
            this.redirect({ id })
          }
        })
    }
  }

  redirect = profile => {
    const { pathname, search, hash } = this.props.location
    const url = `${pathname}/${profile.id}${search}${hash}`
    this.props.history.replace(url)
  }

  render() {
    const { width, theme, profiles } = this.props
    const { common, grey, blue } = theme.palette

    if (!profiles || profiles.length === 1) return null

    const styles = {
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      list: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      sub: {
        margin: '5px 5px 0 0',
        fontSize: 12,
        color: blue.A200,
      },
    }

    return (
      <Dialog disableBackdropClick disableEscapeKeyDown open={true} onClose={() => this.redirect(profiles[0])}>
        <List style={{background: common.white, padding: 0}}>
          {profiles.map(p =>
            <ListItem
              button
              key={p.id}
              style={{borderBottom: `1px solid ${grey[300]}`}}
              onClick={() => this.redirect(p)}
            >
              <div style={styles.list}>
                <div style={{maxWidth: '90%', maxHeight: 90, overflowY: 'hidden'}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <h4>{p.name}</h4>
                    <div style={{fontSize: 13, color: grey[700], marginLeft: 10}}>{p.address}</div>
                  </div>
                  {p.services.map(s =>
                    <span key={s.id} style={styles.sub}>{s.name}</span>
                  )}
                </div>
                <NavigationChevronRight style={{minWidth: 24}} />
              </div>
            </ListItem>
          )}
        </List>
      </Dialog>
    )
  }
}
