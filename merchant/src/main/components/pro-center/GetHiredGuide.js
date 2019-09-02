import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import withWidth from '@material-ui/core/withWidth'
import EmbedMediaPage from 'components/pro-center/EmbedMediaPage'
import Footer from 'components/Footer'
import BreadCrumb from 'components/BreadCrumb'
import { articles } from '@smooosy/config'
import { withTheme } from '@material-ui/core/styles'

const getHiredGuidePages = articles.getHiredGuidePages

@withWidth()
@withTheme
export default class GetHiredGuide extends React.PureComponent {

  render() {
    const { width, theme } = this.props
    const { common, secondary, grey } = theme.palette
    const path = this.props.match.params.path
    const current = getHiredGuidePages[path]

    let next
    const keys = Object.keys(getHiredGuidePages)
    for (let i in keys) {
      if (path === keys[i]) {
        next = keys[parseInt(i) + 1]
        break
      }
    }

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
      {path: '/pro-center/get-hired-guide', text: '顧客獲得ガイド'},
      {text: current.text},
    ]

    return (
      <div style={styles.root}>
        <Helmet>
          <title>{current.text}</title>
          <meta name='description' content={getHiredGuidePages[path].metaDesc} />
        </Helmet>
        <div style={styles.content}>
          <div style={styles.header}>
            <BreadCrumb breads={breads} />
          </div>
          <div>
            <div style={{border: `1px solid ${grey[300]}`, background: grey[100], marginBottom: 50, padding: 10}}>
              <ol>
                {Object.keys(getHiredGuidePages).map((key, i) =>
                  key === path ?
                  <li key={i}>{getHiredGuidePages[key].text}</li>
                  :
                  <li key={i}><Link to={`/pro-center/get-hired-guide/${key}`}>
                    {getHiredGuidePages[key].text}
                  </Link></li>
                )}
              </ol>
            </div>
            <EmbedMediaPage path={current.path} />
          </div>
        </div>
        {next &&
          <Link to={`/pro-center/get-hired-guide/${next}`} style={{display: 'flex', alignItems: 'center', background: grey[200], borderTop: `1px solid ${grey[300]}`}}>
            <div style={{flex: 1}} />
            <div style={{padding: 20}}>次のガイド： {getHiredGuidePages[next].text}</div>
            <NavigationChevronRight />
            <div style={{flex: 1}} />
          </Link>
        }
        <Footer />
      </div>
    )
  }
}
