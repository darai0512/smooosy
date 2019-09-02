import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import withWidth from '@material-ui/core/withWidth'
import Footer from 'components/Footer'
import BreadCrumb from 'components/BreadCrumb'
import { articles } from '@smooosy/config'
import { withTheme } from '@material-ui/core/styles'

const getHiredGuidePages = articles.getHiredGuidePages

@withWidth()
@withTheme
export default class GetHiredGuideTop extends React.PureComponent {
  render() {
    const { width, theme } = this.props
    const { common, secondary, grey } = theme.palette

    const styles = {
      root: {
        background: common.white,
      },
      content: {
        maxWidth: 800,
        width: '90%',
        margin: '0 auto',
        paddingBottom: 30,
      },
      header: {
        padding: '20px 0',
      },
      link: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        height: 120,
        border: `1px solid ${secondary.main}`,
        borderRadius: 5,
        background: common.white,
        fontSize: width === 'xs' ? 17 : 20,
        fontWeight: 'bold',
        color: grey[800],
        margin: 10,
        padding: width === 'xs' ? 10 : 20,
      },
    }
    const breads = [
      {path: '/pro-center', text: 'プロガイド'},
      {text: '顧客獲得ガイド'},
    ]

    return (
      <div style={styles.root}>
        <Helmet>
          <title>顧客獲得ガイド</title>
          <meta name='description' content='顧客獲得ガイドでは、プロフィール・クチコミ・見積もりの作り方など、顧客に選ばれるためのコツを紹介します。SMOOOSYのしくみを理解することで、顧客がどのようなプロを選ぶのか、どのような取り組みをするべきかがイメージできると思います。' />
        </Helmet>
        <div style={styles.content}>
          <div style={styles.header}>
            <BreadCrumb breads={breads} />
          </div>
          <div>
            <h1 style={{fontSize: 24, fontWeight: 'bold', margin: '20px 0'}}>顧客獲得ガイド</h1>
            {Object.keys(getHiredGuidePages).map((key, i) =>
              <Link key={i} style={styles.link} to={`/pro-center/get-hired-guide/${key}`}>
                <div style={{flex: 1}}>
                  <p>{i+1}. {getHiredGuidePages[key].text}</p>
                  <p style={{fontSize: width === 'xs' ? 14 : 16, color: grey[500]}}>{getHiredGuidePages[key].desc}</p>
                </div>
                <NavigationChevronRight />
              </Link>
            )}
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}
