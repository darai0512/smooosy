import React from 'react'
import { Button, Radio, Checkbox, ListItem, ListItemText, ListItemIcon, IconButton } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import NavigationClose from '@material-ui/icons/Close'
import { withStyles } from '@material-ui/core/styles'
import LPButton from 'components/LPButton'
import { showIntercom, hideIntercom } from 'lib/intercom'
import Loading from 'components/Loading'

@withStyles(theme => ({
  services: {
    padding: 0,
    background: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  item: {
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
  },
  dialog: {
    borderRadius: 5,
    color: theme.palette.grey[800],
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    background: theme.palette.grey[100],
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  checkbox: {
    padding: 0,
    width: 'auto',
    height: 'auto',
  },
  radio: {
    padding: 0,
    width: 'auto',
    height: 'auto',
  },
  center: {
    textAlign: 'center',
    padding: 10,
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  button: {
    fontSize: 18,
    height: 40,
    minWidth: 100,
    padding: 0,
  },
}))
export default class SelectService extends React.Component {
  static defaultProps = {
    open: false,
    title: 'サービスを選択してください',
    multi: false,
    label: '選択する',
    services: [],
    onSelect: () => {},
    inline: false,
    className: {},
  }

  constructor(props) {
    super(props)
    this.state = {
      selected: props.services.length ? props.services.slice(0, 1) : [],
      csr: false,
    }
  }

  componentDidMount() {
    this.setState({csr: true})
  }

  select = (s) => {
    let selected
    if (this.props.multi) {
      selected = this.state.selected.slice()
      const index = selected.map(s => s.id).indexOf(s.id)
      if (index === -1) {
        selected.push(s)
      } else {
        selected.splice(index, 1)
      }
    } else {
      const { services } = this.props
      const index = services.map(service => service.id).indexOf(s.id)
      selected = [services[index]]
    }
    this.setState({selected})
  }

  submit = e => {
    e.preventDefault()
    const { skipShowIntercom } = this.props
    !skipShowIntercom && showIntercom()
    if (this.props.multi) {
      this.props.onSelect(this.state.selected)
    } else {
      this.props.onSelect(this.state.selected[0] || null)
    }
    //this.props.onClose()
  }

  onClose = () => {
    showIntercom()
    this.props.onClose(this.state.selected)
  }

  render() {
    const { selected, csr } = this.state
    const { open, title, multi, label, services, inline, classes, className } = this.props

    if (open && !csr) {
      return <Loading style={{position: 'fixed', top: 0, left: 0, zIndex: 11, background: 'rgba(0, 0, 0, .5)'}} progressStyle={{color: '#fff'}} />
    }

    const list = (
      <>
        {services.map(s =>
          <ListItem
            button
            divider
            key={s.id}
            className={['serviceSelect', classes.item].join(' ')}
            onClick={() => this.select(s)}
          >
            <ListItemIcon>
              {multi ?
                <Checkbox color='primary' className={classes.checkbox} classes={{checked: className.checkbox}} checked={selected.indexOf(s) !== -1} />
              :
                <Radio color='primary' className={classes.radio} checked={s.id === (selected[0] || {}).id} />
              }
            </ListItemIcon>
            <ListItemText primary={s.name} />
          </ListItem>
        )}
      </>
    )

    return inline ? (
      <div>
        <div className={className.list ? `${classes.services} ${className.list}`: classes.services}>
          {list}
        </div>
        <div className={classes.center}>
          <LPButton className={className.button ? className.button : ''} onClick={this.submit} disabled={selected.length === 0}>{label}</LPButton>
        </div>
      </div>
    ) : (
      <Dialog
        open={open}
        className={classes.dialog}
        onEnter={hideIntercom}
        onClose={this.onClose}
      >
        <DialogTitle className={classes.title}>
          {title}
          <IconButton className={classes.close} onClick={this.onClose}><NavigationClose /></IconButton>
        </DialogTitle>
        <DialogContent className={className.list ? `${classes.services} ${className.list}`: classes.services}>
          {list}
        </DialogContent>
        <DialogActions>
          <Button variant='contained'
            color='primary'
            className={['serviceSelectButton', classes.button, className.button].join(' ')}
            disabled={selected.length === 0}
            onClick={this.submit}
          >
            {label}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}
