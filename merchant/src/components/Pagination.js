import React from 'react'
import { withRouter } from 'react-router'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { webOrigin } from '@smooosy/config'

@withWidth()
@withTheme
@withRouter
export default class Pagination extends React.PureComponent {
  static defaultProps = {
    total: 1,
    current: 1,
    perpage: 20,
    simple: false,
    onChange: () => {},
  }

  getUrlForPage(page) {
    let query = qs.parse(location.search.slice(1))

    query.page = page === 1 ? undefined : page

    const queryString = qs.stringify(query) === '' ? '' : `?${qs.stringify(query)}`

    return `${webOrigin}${this.props.location.pathname}${queryString}`
  }

  render() {
    const { total, current, perpage, simple, onChange, theme, width } = this.props
    const { common, grey } = theme.palette

    const page = Math.ceil(total / perpage)
    if (page === 1) return null

    const BUTTON_NUM = width === 'xs' ? 3 : 5
    const HALF = Math.floor(BUTTON_NUM / 2)

    const start = page <= BUTTON_NUM ? 1 : Math.min(Math.max(current - HALF, 1), page - BUTTON_NUM + 1)
    const size = Math.min(page, BUTTON_NUM)

    const styles = {
      root: {
        display: 'flex',
        justifyContent: 'space-between',
      },
      button: {
        minWidth: 50,
        background: common.white,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: grey[300],
      },
    }

    return (
      <div>
        <Helmet>
          {current !== 1 && <link rel='prev' href={this.getUrlForPage(current - 1)} />}
          {current !== page && <link rel='next' href={this.getUrlForPage(current + 1)} />}
        </Helmet>
        <div style={styles.root}>
          <Button style={styles.button} disabled={current === 1} onClick={() => onChange(current - 1)}>
            <ChevronLeftIcon />
            前
          </Button>
          {!simple &&
            <div style={{display: 'flex'}}>
              {[...Array(size)].map((_, i) => {
                const idx = start + i
                const style = {
                  ...styles.button,
                  width: 50,
                  borderRadius: i === 0 ? '2px 0 0 2px' : i === 4 ? '0 2px 2px 0' : 0,
                  borderWidth: i === 0 ? 1 : '1px 1px 1px 0',
                }
                return (
                  <Button key={i} style={style} disabled={idx === current} onClick={() => onChange(idx)}>
                    {idx}
                  </Button>
                )
              })}
            </div>
          }
          <Button style={styles.button} disabled={current === page} onClick={() => onChange(current + 1)} rel='next'>
            次
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    )
  }
}
