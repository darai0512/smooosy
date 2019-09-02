import React from 'react'
import { Link } from 'react-router-dom'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import { withTheme, withStyles } from '@material-ui/core/styles'

@withWidth()
@withTheme
@withStyles(theme => ({
  category: {
    '&:hover': {
      background: theme.palette.common.white,
      borderRadius: 4,
    },
  },
}))
export default class CategoryList extends React.Component {
  static defaultProps = {
    categories: [],
    onSelect: null,
    linkFunction: null,
  }

  render() {
    const { categories, onSelect, linkFunction, width, theme, classes } = this.props
    const { grey } = theme.palette

    const styles = {
      subWrapper: {
        width: '100%',
        margin: width === 'xs' ? '0 auto' : '10px auto',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
      },
      category: {
        display: 'flex',
        color: grey[800],
        width: width === 'md' ? '33%' : '50%',
        fontSize: width === 'xs' ? 12 : 14,
        padding: width === 'xs' ? 10 : '10px 20px',
        alignItems: 'center',
        cursor: 'pointer',
      },
      dummyCategory: {
        width: width === 'md' ? '33%' : '50%',
        padding: width === 'xs' ? '0 10px' : '0 20px',
      },
    }

    return (
      <div style={styles.subWrapper}>
        {categories.map((c, i) => {
          const categoryStyle = {
            ...styles.category,
            borderBottom: width === 'xs' && categories.length - i > 2 - categories.length % 2 ? `1px solid ${grey[300]}`: 0,
            borderRight: width === 'xs' && i % 2 === 0 ? `1px solid ${grey[300]}` : 0,
          }

          return linkFunction ?
            <Link key={c.key} to={linkFunction(c)} style={categoryStyle} className={classes.category}>
              <div style={{flex: 1}}>{c.name}</div>
              <NavigationChevronRight />
            </Link>
          : onSelect ?
            <div key={c.key} onClick={() => onSelect(c)} style={categoryStyle} className={classes.category}>
              <div style={{flex: 1}}>{c.name}</div>
              <NavigationChevronRight />
            </div>
          : null
        })}
        {[...Array(3)].map((_, i) => <div key={i} style={styles.dummyCategory} />)}
      </div>
    )
  }
}
