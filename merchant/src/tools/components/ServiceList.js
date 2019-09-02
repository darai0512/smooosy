import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { loadAll as loadServices } from 'tools/modules/service'
import { loadAll as loadCategories } from 'tools/modules/category'

@withWidth()
@withTheme
@connect(
  state => ({
    services: state.service.allServices,
    categories: state.category.categories,
  }),
  { loadServices, loadCategories },
)
export default class ServiceList extends React.PureComponent {
  componentDidMount() {
    this.props.loadServices('')
    this.props.loadCategories()
  }

  render() {
    const {services, categories, width, theme} = this.props
    const { common, grey } = theme.palette

    const styles = {
      wrap: {
        columnCount: {xs: 1, sm: 3, md: 3, lg: 4, xl: 4}[width],
        columnGap: 30,
        minHeight: '100vh',
        marginBottom: 30,
      },
      column: {
        columnBreakInside: 'avoid',
        pageBreakInside: 'avoid',
        marginBottom: 20,
        width: '100%',
        background: common.white,
        border: `1px solid ${grey[300]}`,
      },
      columnHeader: {
        padding: 10,
        background: grey[50],
        borderBottom: `1px solid ${grey[300]}`,
      },
      sub: {
        fontWeight: 'bold',
      },
      columnBody: {
        padding: 10,
      },
      service: {
        fontSize: 12,
        lineHeight: width === 'xs' ? 2.5 : 1.8,
      },
      footer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }

    return (
      <div style={{padding: 10}}>
        <h3 style={{margin: 20}}>サービス一覧</h3>
        <div style={styles.wrap}>
          {categories.map((c, i) => {
            const enabled = services.filter(s => s.tags.indexOf(c.name) !== -1)
            return (
              <div key={i} style={styles.column}>
                <div style={styles.columnHeader}><Link to={`/categories/${c.key}`}>{c.name}</Link></div>
                <div style={styles.columnBody}>
                  {enabled.filter(s => s.tags.indexOf(c.name) !== -1).map(s =>
                    <div key={s.id} style={styles.service}>
                      <span style={{color: grey[500]}}>» </span>
                      <Link to={`/services/${s.id}`}>{s.name}</Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={styles.footer}>
          <Button variant='contained' color='secondary' component={Link} to='/categories/new'>カテゴリ追加</Button>
        </div>
      </div>
    )
  }
}
