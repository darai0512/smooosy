import React from 'react'
import { Tabs, Tab, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import NavigationClose from '@material-ui/icons/Close'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import NotificationEventAvailable from '@material-ui/icons/EventAvailable'
import ActionHome from '@material-ui/icons/Home'
import PlacesBusinessCenter from '@material-ui/icons/BusinessCenter'
import ActionSupervisorAccount from '@material-ui/icons/SupervisorAccount'

import { sections } from '@smooosy/config'

sections[0].icon = NotificationEventAvailable
sections[1].icon = ActionHome
sections[2].icon = PlacesBusinessCenter
sections[3].icon = ActionSupervisorAccount


@withStyles(theme => ({
  root: {
    color: theme.palette.grey[800],
    borderRadius: 5,
  },
  title: {
    background: theme.palette.grey[100],
    fontSize: 18,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  tabStyle: {
    width: '100%',
    background: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  categoryContent: {
    position: 'relative',
    width: '100%',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  category: {
    display: 'flex',
    padding: 10,
    fontSize: 14,
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    '&:hover': {
      background: theme.palette.grey[100],
    },
  },
}), {withTheme: true})
export default class ModalSelectCategory extends React.Component {
  static defaultProps = {
    open: false,
    title: 'あなたの専門は何ですか？',
    onClose: () => {},
    onSelect: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {
      categoryIndex: 0,
    }
  }

  onSelect = (category) => {
    this.props.onSelect(category)
  }

  render() {
    const { categoryIndex } = this.state
    const { open, title, onClose, theme, classes, categories } = this.props
    const { common, grey } = theme.palette

    return (
      <Dialog
        open={open}
        className={classes.root}
        onClose={onClose}
      >
        <DialogTitle className={classes.title}>
          {title}
          <IconButton style={{position: 'absolute', top: 0, right: 0}} onClick={onClose}><NavigationClose /></IconButton>
        </DialogTitle>
        <DialogContent style={{padding: 0}}>
          <div style={{background: common.white}}>
            <Tabs value={categoryIndex} onChange={ (event, categoryIndex) => this.setState({categoryIndex})} className={classes.tabStyle} variant='fullWidth'>
              {sections.map((sec, i) =>
                <Tab className='sectionTab' key={i} style={{height: 70}} value={i} icon={<sec.icon />} label={sec.name} />
              )}
            </Tabs>
          </div>
          <div className={classes.categoryContent}>
            {categories.filter(c => c.parent === sections[categoryIndex].key).map(c =>
              <div key={c.key} className={['categorySelect', classes.category].join(' ')} onClick={() => this.onSelect(c)}>
                <div style={{flex: 1}}>{c.name}</div>
                <NavigationChevronRight />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions style={{background: grey[100], margin: 0, padding: 10}}>
          <Button onClick={onClose} >キャンセル</Button>
        </DialogActions>
      </Dialog>
    )
  }
}
