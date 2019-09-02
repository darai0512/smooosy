import React from 'react'
import { Helmet } from 'react-helmet'
import { Table, TableBody } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import SubHeader from 'components/SubHeader'
import CustomRow from 'components/CustomRow'

@withWidth()
export default class LawPage extends React.PureComponent {
  render() {
    const { width } = this.props

    const styles = {
      root: {
        maxWidth: 960,
        padding: width === 'xs' ? 24 : 32,
        margin: '32px auto',
        background: '#fff',
        border: '2px solid #ddd',
      },
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>特定商取引法に基づく表記</title>
          <meta name='robots' content='noindex' />
        </Helmet>
        <SubHeader>特定商取引法に基づく表記</SubHeader>
        <Table style={{width: '90%', margin: '20px auto'}}>
          <TableBody>
            <CustomRow title='販売事業主名'>株式会社SMOOOSY</CustomRow>
            <CustomRow title='運営責任者'>石川 彩子</CustomRow>
            <CustomRow title='本社所在地'>
              <p>〒107-0052 東京都港区赤坂2-22-19-601</p>
            </CustomRow>
            <CustomRow title='問い合わせ窓口'>
              <p>info@smooosy.biz</p>
              <p>050-1745-0159</p>
            </CustomRow>
            <CustomRow title='販売価格'>
              SMOOOSYポイントの価格は<a onClick={() => this.props.history.push('/pro-center/point')}>「SMOOOSYポイント」</a>ページに記載しております。
            </CustomRow>
            <CustomRow title='商品代金以外の必要料金'>なし</CustomRow>
            <CustomRow title='支払方法'>クレジットカード決済</CustomRow>
            <CustomRow title='支払時期'>ポイント購入時に決済</CustomRow>
            <CustomRow title='商品の引渡し時期'>SMOOOSYポイントは、お支払手続き完了後ただちに引渡します。 </CustomRow>
            <CustomRow title='返品・交換不良品について'>当社はいかなる場合も商品購入に関するキャンセル・返品等を受付けません。</CustomRow>
          </TableBody>
        </Table>
      </div>
    )
  }
}
