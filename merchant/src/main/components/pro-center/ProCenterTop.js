import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import withWidth from '@material-ui/core/withWidth'
import CoverImages from 'components/CoverImages'
import Footer from 'components/Footer'
import { withTheme } from '@material-ui/core/styles'

@withWidth()
@withTheme
export default class ProCenterTop extends React.PureComponent {
  render() {
    const { width, theme } = this.props
    const { common, secondary, grey } = theme.palette

    const styles = {
      root: {
        maxWidth: 960,
        width: '90%',
        margin: '0 auto',
        padding: '20px 0',
      },
      mask: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      title: {
        margin: 20,
        textAlign: 'center',
        color: common.white,
        textShadow: '1px 1px 8px rgba(0, 0, 0, .8)',
      },
      link: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        height: 120,
        border: `1px solid ${secondary.main}`,
        borderRadius: 5,
        background: common.white,
        fontSize: 20,
        fontWeight: 'bold',
        color: grey[800],
        margin: 10,
        padding: 20,
      },
    }
    return (
      <div>
        <Helmet>
          <title>プロガイドトップ</title>
          <meta name='description' content='プロガイドページでは顧客獲得のためのガイドや、SMOOOSYのポイント制度を説明しています。また、事業者様からのよくある質問と回答を紹介しますので、ぜひご確認ください。SMOOOSY上で顧客を増やしているプロの動向をチェックしてみてください。' />
        </Helmet>
        <CoverImages
          height={width === 'xs' ? 280 : 320}
          firstImage={width === 'xs' ? '/images/pro-top-small.jpg' : '/images/pro-top.jpg'}
          alpha='0.5'
        >
          <div style={styles.mask}>
            <div style={styles.title}>
              <div style={{fontSize: width === 'xs' ? 32 : 45}}>プロガイド</div>
              <div style={{fontSize: width === 'xs' ? 13 : 18, margin: '10px 0'}}>
                <p>SMOOOSYで多くのプロが顧客を増やしています。</p>
                <p>オンライン集客のコツをマスターしましょう。</p>
              </div>
            </div>
          </div>
        </CoverImages>
        <div style={styles.root}>
          <div>
            <Link style={styles.link} to='/pro-center/get-hired-guide'>
              <div style={{flex: 1}}>顧客獲得ガイド</div>
              <NavigationChevronRight />
            </Link>
            <Link style={styles.link} to='/pro-center/point'>
              <div style={{flex: 1}}>SMOOOSYポイントとは</div>
              <NavigationChevronRight />
            </Link>
            <a style={styles.link} href='https://help.smooosy.com'>
              <div style={{flex: 1}}>よくある質問</div>
              <NavigationChevronRight />
            </a>
          </div>
          <div style={{margin: '50px 0', textAlign: 'center'}}>
            プロ登録がまだの方は<Link to='/pro'>プロ登録</Link>しましょう
          </div>
        </div>
       <Footer />
      </div>
    )
  }
}
