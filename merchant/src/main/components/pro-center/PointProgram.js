import React from 'react'
import { Helmet } from 'react-helmet'
import EmbedMediaPage from 'components/pro-center/EmbedMediaPage'
import Footer from 'components/Footer'
import BreadCrumb from 'components/BreadCrumb'

const PointProgram = () => {
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
    {path: '/pro-center/point', text: 'SMOOOSYポイントとは'},
    {text: 'ポイントプログラム'},
  ]
  return (
    <div style={styles.root}>
      <Helmet>
        <title>ポイントプログラム</title>
      </Helmet>
      <div style={styles.container}>
        <div style={styles.header}>
          <BreadCrumb breads={breads} />
        </div>
        <EmbedMediaPage path='/pages/14970' />
      </div>
      <Footer />
    </div>
  )
}

export default PointProgram
