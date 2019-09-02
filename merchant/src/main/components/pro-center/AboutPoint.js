import React from 'react'
import { Helmet } from 'react-helmet'
import EmbedMediaPage from 'components/pro-center/EmbedMediaPage'
import Footer from 'components/Footer'
import BreadCrumb from 'components/BreadCrumb'

const AboutPoint = () => {
  const styles = {
    root: {
      background: '#fff',
    },
    container: {
      maxWidth: 960,
      width: '90%',
      margin: '0 auto',
    },
    header: {
      padding: '20px 0',
    },
  }
  const breads = [
    {path: '/pro-center', text: 'プロガイド'},
    {text: 'SMOOOSYポイントとは'},
  ]
  return (
    <div style={styles.root}>
      <Helmet>
        <title>SMOOOSYポイントとは</title>
        <meta name='description' content='SMOOOSYポイントとは依頼への応募時に手数料として利用するポイントのことです。1ポイント＝150円（税抜き）で購入することができます。プロフィールの充実や、知り合いのプロ紹介、口コミの獲得などで無料ポイントを獲得することもできます。' />
      </Helmet>
      <div style={styles.container}>
        <div style={styles.header}>
          <BreadCrumb breads={breads} />
        </div>
        <EmbedMediaPage path='/pages/592' />
      </div>
      <Footer />
    </div>
  )
}

export default AboutPoint
