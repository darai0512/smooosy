import React from 'react'
import { connect } from 'react-redux'
import { Button, Hidden, IconButton, List, ListItemSecondaryAction, MenuItem, MenuList } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import RightIcon from '@material-ui/icons/KeyboardArrowRight'
import { sections } from '@smooosy/config'

import { loadAll as loadAllCategories } from 'modules/category'

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
  hidden: {
    width: '100%',
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
  sections: {
    width: '27%',
    borderRight: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      borderRight: 'none',
    },
  },
  categories: {
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
  inputLabel: {
    fontSize: 14,
    cursor: 'pointer',
    color: 'black',
    width: '100%',
  },
  sticky: {
    marginTop: 20,
    position: 'sticky',
    bottom: 20,
    right: 20,
  },
  serviceListMenuItem: {
    whiteSpace: 'pre-wrap',
  },
  selected: {
    backgroundColor: `${theme.palette.blue.B200} !important`,
    color: theme.palette.common.white,
  },
  button: {
    zIndex: 10,
  },
}))
@connect(
  state => ({
    categories: state.category.categories,
  }),
  { loadAllCategories }
)
export default class ServiceSelectorDetail extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      category: {},
      section: {},
      selectedCategories: [],
      selectedServices: [],
      selected: props.selected || [],
      stageForMobile: 0,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { selectedServices } = prevState
    const { services } = this.props
    const serviceIds = services.map(s => s.id)
    if (selectedServices.some(s => !serviceIds.includes(s.id))) {
      this.setState({
        selectedServices: selectedServices.filter(s => services.map(s => s.id).includes(s.id)),
      })
    }
  }

  componentDidMount() {
    this.props.loadAllCategories()
  }

  selectSection = section => {
    const { categories } = this.props
    const selectedCategories = categories.filter(c => c.parent === section.key)
    this.setState({selectedCategories, selectedServices: [], section, category: {}, stageForMobile: 1})
  }

  selectCategory = category => {
    const { services } = this.props
    const selectedServices = services.filter(s => s.tags.includes(category.name))
    this.setState({selectedServices, category, stageForMobile: 2})
  }

  selectService = serviceId => {
    const { selected } = this.state
    if (selected.includes(serviceId)) {
      this.setState({selected: selected.filter(s => s !== serviceId)})
    } else {
      selected.push(serviceId)
      this.setState({selected})
    }
  }

  render() {
    const { classes, onSelect, multiple, services } = this.props
    const { stageForMobile, section, category, selectedCategories, selectedServices, selected } = this.state

    if (!services) return null

    const SectionList = () => (
      <div className={classes.sections}>
        <List className={classes.list}>
          {sections.map((sec, idx) =>
            <MenuItem component='div' size='small' key={idx} onClick={() => this.selectSection(sec)} className={classes.menuItem} selected={section.name === sec.name}>
              {sec.name}
              <ListItemSecondaryAction className={classes.center}>
                <IconButton disabled className={classes.black} onClick={() => this.selectSection(sec)}><RightIcon className={classes.rightIcon}  /></IconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          )}
        </List>
      </div>
    )

    const CategoryList = () => (
      <div className={classes.categories}>
        <List className={classes.list}>
          {selectedCategories.map((cat, idx) => (
            <MenuItem component='div' size='small' key={idx} onClick={() => this.selectCategory(cat)} className={classes.menuItem} selected={category.id === cat.id}>
              {cat.name}
              <ListItemSecondaryAction className={classes.center}>
                <IconButton disabled className={classes.black} onClick={() => this.selectCategory(cat)}><RightIcon className={classes.rightIcon} /></IconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          ))}
        </List>
      </div>
    )

    const ServiceList = () => (
      <div className={classes.services}>
        <List className={classes.list}>
        {multiple ?
          <div>
            <MenuList>
              {selectedServices.map((service, idx) => (
                <MenuItem
                  key={idx}
                  classes={{root: classes.serviceListMenuItem, selected: classes.selected}}
                  selected={selected.includes(service.id)}
                  onClick={() => this.selectService(service.id)}
                >
                  {service.name}
                </MenuItem>
              ))}
            </MenuList>
            {!!selectedServices.length &&
              <div className={`${classes.flex} ${classes.sticky}`}>
                <div className={classes.flex} />
                <Button variant='contained' color='primary' className={classes.button} onClick={() => onSelect(services.filter(s => selected.includes(s.id)))}>決定</Button>
              </div>
            }
          </div>
        :
          selectedServices.map((service, idx) => (
            <MenuItem component='div' size='small' key={idx} className={classes.menuItem} onClick={() => onSelect(service)}>{service.name}</MenuItem>
          ))
        }
        </List>
      </div>
    )

    return (
      <div className={classes.root}>
        <Hidden implementation='css' smUp>
          <div className={classes.bread}>
            <a className={classes.padding} onClick={() => this.setState({stageForMobile: 0, section: {}, category: {}})}>トップ</a>
            {section.name && [
              <span key='arrow'>{'>'}</span>,
              <a key='link' className={classes.padding} onClick={() => this.setState({stageForMobile: 1, category: {}})}>{section.name}</a>,
            ]}
            {category.name && [
              <span key='arrow'>{'>'}</span>,
              <div key='leaf' className={classes.padding}>{category.name}</div>,
            ]}
          </div>
          {
            stageForMobile === 0 ? <SectionList /> :
            stageForMobile === 1 ? <CategoryList /> :
            stageForMobile === 2 ? <ServiceList /> : null}
        </Hidden>
        <Hidden className={classes.hidden} implementation='css' xsDown>
          <div className={classes.flex}>
            <SectionList />
            <CategoryList />
            <ServiceList />
          </div>
        </Hidden>
      </div>
    )
  }
}
