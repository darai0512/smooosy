import React from 'react'
import { List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'


export const commonStyles = {
  root: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    outline: 'none',
    marginBottom: 0,
    '-webkit-appearance': 'none',
  },
  inputWithSuggests: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    padding: 0,
  },
  listItem: {
    fontSize: 14,
    overflow: 'hidden',
    padding: '8px 12px',
  },
  listItemIcon: {
    marginRight: 0,
  },
}

export default class IncrementalElasticSearch extends React.Component {
  static defaultProps = {
    placeholder: '検索',
    searchPromise: Promise.resolve([]),
    onSelect: () => {},
    displayName: data => data.name,
    rootClass: '',
    inputClass: '',
    value: '',
    filter: () => true,
    reverse: false,
    blurHide: true,
  }

  constructor(props) {
    super(props)
    this.state = {
      value: props.value,
      suggest: [],
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({value: this.props.value})
    }
  }

  onChange = (e) => {
    const { reverse, onSuggest } = this.props
    const query = e.target.value.trim()
    this.setState({value: query})

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.timer = setTimeout(() => {
      this.props.searchPromise(query)
        .then(suggest => suggest.filter(this.props.filter))
        .then(suggest => {
          const copySuggest = suggest.slice() // コピーする
          if (reverse) copySuggest.reverse() // reverseは破壊的操作
          onSuggest && onSuggest(copySuggest, reverse)
          this.setState({ suggest: copySuggest })
        })
    }, 500)
  }

  onBlur = () => {
    if (this.props.blurHide) {
      setTimeout(() => this.setState({suggest: []}), 500)
    }
  }

  onSelect = (value) => {
    const { onSelect } = this.props
    const selected = this.state.suggest.find(d => d.id === value)
    if (selected) {
      onSelect && onSelect(selected)
      this.setState({
        value: this.props.displayName(selected),
        suggest: [],
      })
    }
  }

  render() {
    const {
      displayName, placeholder,
      inputClassName, inputSuggestClassName, classes,
      showSearchIcon,
    } = this.props
    const { suggest } = this.state

    const inputClasses = [classes.input]
    if (inputClassName) inputClasses.push(inputClassName)
    if (suggest.length && inputSuggestClassName) inputClasses.push(inputSuggestClassName)
    if (suggest.length) inputClasses.push(classes.inputWithSuggests)

    return (
      <div className={classes.root}>
        <input
          value={this.state.value}
          className={inputClasses.join(' ')}
          placeholder={placeholder}
          onFocus={this.onChange}
          onChange={this.onChange}
          onBlur={this.onBlur}
        />
        {suggest.length > 0 &&
          <List className={[classes.list, 'suggests'].join(' ')}>
            {suggest.slice(0, 10).map((s, idx) =>
              <ListItem button key={s._id} className={[classes.listItem, `suggest_${idx}`].join(' ')} onClick={() => this.onSelect(s._id)}>
                {showSearchIcon ?
                  <>
                    <ListItemIcon className={classes.listItemIcon}>
                      <SearchIcon className={classes.searchIcon} />
                    </ListItemIcon>
                    <ListItemText primary={displayName(s)} style={{padding: 0}} className={classes.listItemText} disableTypography={true} />
                  </>
                  : <ListItemText primary={displayName(s)} />
                }
              </ListItem>
            )}
          </List>
        }
      </div>
    )
  }
}

export const IncrementalElasticSearchTopPage = withStyles(theme => ({
  root: {
    ...commonStyles.root,
    maxWidth: 800,
    height: 64,
  },
  input: {
    ...commonStyles.input,
    height: '100%',
    padding: '5px 50px 5px 15px',
    fontSize: 18,
    border: `3px solid ${theme.palette.primary.main}`,
    borderRadius: 8,
    boxShadow: '0px 3px 6px rgba(0,0,0,0.16)',
    '&:focus': {
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: 'none',
    },
    [theme.breakpoints.down('xs')]: {
      padding: '3px 8px',
    },
  },
  inputWithSuggests: commonStyles.inputWithSuggests,
  list: {
    ...commonStyles.list,
    background: theme.palette.common.white,
    borderTop: 'none',
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    borderRight: `2px solid ${theme.palette.primary.main}`,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      top: 64,
    },
  },
  listItem: commonStyles.listItem,
  listItemIcon: commonStyles.listItemIcon,
}))(IncrementalElasticSearch)

export const IncrementalElasticSearchTopPageMobile = withStyles(theme => ({
  root: {
    ...commonStyles.root,
    height: 48,
    padding: '0px 10px',
  },
  input: {
    ...commonStyles.input,
    fontSize: 18,
    height: '100%',
    padding: '5px 5px 5px 15px',
    boxShadow: '0px 3px 6px rgba(0,0,0,0.16)',
    border: `3px solid ${theme.palette.primary.main}`,
    borderRadius: 8,
    '&:focus': {
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: 'none',
    },
    [theme.breakpoints.down('xs')]: {
      padding: '3px 8px',
    },
  },
  inputWithSuggests: commonStyles.inputWithSuggests,
  list: {
    ...commonStyles.list,
    background: theme.palette.common.white,
    borderTop: 'none',
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    borderRight: `2px solid ${theme.palette.primary.main}`,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      top: 48,
      marginLeft: 10,
      marginRight: 10,
    },
  },
  listItem: commonStyles.listItem,
  listItemIcon: commonStyles.listItemIcon,
}))(IncrementalElasticSearch)

export const IncrementalElasticSearchProServiceAddService = withStyles(theme => ({
  root: {
    ...commonStyles.root,
    maxWidth: 800,
    height: 64,
  },
  input: {
    ...commonStyles.input,
    fontSize: 18,
    height: '100%',
    padding: '5px 50px 5px 15px',
    borderRadius: 8,
    border: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: '3px 8px',
    },
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  inputWithSuggests: commonStyles.inputWithSuggests,
  list: {
    ...commonStyles.list,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      top: 64,
    },
  },
  listItem: commonStyles.listItem,
  listItemIcon: commonStyles.listItemIcon,
}))(IncrementalElasticSearch)


export const IncrementalElasticSearchGlobal = withStyles(theme => ({
  root: {
    ...commonStyles.root,
    maxWidth: 300,
  },
  input: {
    ...commonStyles.input,
    height: '100%',
    padding: '5px 15px',
    fontSize: 16,
    fontWeight: 'bold',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderWidth: '1px 0 1px 1px',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 0,
    [theme.breakpoints.down('xs')]: {
      padding: '3px 8px',
    },
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  inputWithSuggests: commonStyles.inputWithSuggests,
  list: {
    ...commonStyles.list,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      top: 39,
    },
  },
  listItem: commonStyles.listItem,
  listItemIcon: commonStyles.listItemIcon,
}))(IncrementalElasticSearch)

export const IncrementalElasticSearchGlobalDialog = withStyles(theme => ({
  root: {
    ...commonStyles.root,
    flex: 1,
    marginLeft: 10,
  },
  input: {
    ...commonStyles.input,
    height: 40,
    fontSize: 15,
    padding: '5px 15px',
    borderRadius: 4,
    border: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: '3px 8px',
    },
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  inputWithSuggests: commonStyles.inputWithSuggests,
  list: {
    ...commonStyles.list,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      top: 39,
    },
  },
  listItem: commonStyles.listItem,
  listItemIcon: commonStyles.listItemIcon,
}))(IncrementalElasticSearch)
