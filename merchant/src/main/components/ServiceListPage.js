import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { loadAll as loadServices } from 'modules/service'
import { loadAll as loadCategories } from 'modules/category'
import Container from 'components/Container'
import Footer from 'components/Footer'
import Loading from 'components/Loading'


@withWidth()
@withTheme
@connect(
  state => ({
    services: state.service.services.filter(s => s.enabled),
    categories: state.category.categories,
  }),
  { loadServices, loadCategories },
)
export default class ServiceListPage extends React.PureComponent {
  componentDidMount() {
    this.props.loadServices()
    this.props.loadCategories()
  }

  render() {
    const {services, categories, width, theme} = this.props
    const { common, grey } = theme.palette

    if (services.length === 0 || categories.length === 0) return <Loading />

    const styles = {
      wrap: {
        columnCount: {xs: 1, sm: 2, md: 3}[width],
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
        borderWidth:  width === 'xs' ? '1px 0' : 1,
        borderStyle: 'solid',
        borderColor: grey[300],
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
        fontSize: 14,
        lineHeight: width === 'xs' ? 2.5 : 1.8,
      },
    }

    return (
      <div>
        <Helmet>
          <title>サービス一覧</title>
          <meta name='description' content='SMOOOSYは、あなたにぴったりのプロを見つけられるプラットフォームです。カメラマンから税理士まで幅広いサービスを提供しています。2分のカンタン依頼でプロから見積もりを集めることができるサービスを一覧にして紹介します。' />
        </Helmet>
        <Container>
          <Typography variant='h4' style={{margin: 20}}>サービス一覧</Typography>
          <div style={styles.wrap}>
            {categories.map((c, i) => {
              const enabled = services.filter(s => s.tags.indexOf(c.name) !== -1)
              if (enabled.length === 0) return null
              return (
                <div key={i} style={styles.column}>
                  <div style={styles.columnHeader}>
                    <Link to={`/t/${c.key}`} style={styles.sub}>{c.name}</Link>
                  </div>
                  <div style={styles.columnBody}>
                    {enabled.filter(s => s.tags.indexOf(c.name) !== -1).map(s =>
                      <div key={s.id} style={styles.service}>
                        <span style={{color: grey[500]}}>» </span>
                        <Link to={`/services/${s.key}`}>{s.name}</Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Container>
        <Footer />
      </div>
    )
  }
}
