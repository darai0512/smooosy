import React from 'react'
import { List, MenuItem, ListItemSecondaryAction, IconButton } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import RightIcon from '@material-ui/icons/KeyboardArrowRight'


@withStyles(theme => ({
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    fontSize: '80%',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  flex: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  list: {
    fontSize: 13,
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
  },
  category: {
    width: '27%',
    borderRight: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      borderRight: 'none',
    },
  },
  tags: {
    width: '33%',
    borderRight: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      borderRight: 'none',
    },
  },
  services: {
    width: '40%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  black: {
    color: '#000',
  },
  rightIcon: {
    width: 28,
    height: 28,
  },
  menuItem: {
    margin: '0 1px 1px 1px',
    fontSize: 14,
  },
  center: {
    alignItems: 'center',
  },
  padding: {
    padding: 5,
  },
  bread: {
    color: theme.palette.grey[700],
    display: 'flex',
    alignItems: 'center',
    height: 35,
    background: '#f6f6f6',
    marginBottom: 8,
  },
}))
export default class LocationSelector extends React.Component {

  static defaultProps = {
    locations: [],
    selectLocation: () => {},
  }

  constructor (props) {
    super(props)
    this.state = {
      currentSelect: { path: '' },
    }
  }

  selectLocation = (l, isLast) => {
    if (!isLast) {
      this.setState({currentSelect: l})
    }
  }

  render() {
    const { classes, locations } = this.props
    const { currentSelect } = this.state

    const paths = ['日本', ...currentSelect.path.split(',')]

    const LocationList = ({locations, all}) => (
      <div className={classes.category}>
        <List className={classes.list}>
          {locations.map((l, idx) => {
            const isLast = all.filter(ll => ll.parentName === l.name).length === 0
            return (
              <MenuItem component='div' size='small' key={idx} onClick={() => this.selectLocation(l, isLast)} className={classes.menuItem} selected={false}>
                {l.name}
                <ListItemSecondaryAction className={classes.center}>
                  <IconButton disableRipple className={classes.black} onClick={() => this.selectLocation(l, isLast)}>{!isLast && <RightIcon className={classes.rightIcon} />}</IconButton>
                </ListItemSecondaryAction>
              </MenuItem>
            )
          }
          )}
        </List>
      </div>
    )

    return (
      <div className={classes.root}>
      {
        paths.map((name, i) => {
          return <LocationList key={`${name}_${i}`} locations={locations.filter(l => l.parentName === name)} all={locations} />
        })
      }
      </div>
    )
  }
}
