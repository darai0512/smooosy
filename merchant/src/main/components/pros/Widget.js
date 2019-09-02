import React from 'react'
import { grey } from '@material-ui/core/colors'
import RatingStar from 'components/RatingStar'
import { webOrigin } from '@smooosy/config'

const Widget = props => {
  const { script, id, shortId, name, number, rating } = props
  const styles = {
    logo: {
      alignSelf: 'center',
      width: 140,
      height: 35,
    },
    proLink: {
      padding: 5,
      color: grey[600],
      textDecoration: 'none',
      fontSize: 18,
      wordWrap: 'break-word',
      textAlign: 'center',
    },
    rating: {
      padding: 5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    review: {
      color: grey[500],
      fontSize: 13,
    },
    root: {
      width: '100%',
      maxWidth: 250,
      minWidth: 180,
      textDecoration: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      boxShadow: 'rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px',
      borderRadius: 5,
      padding: 10,
      background: '#fff',
    },
    star: {
      width: 120,
      display: 'flex',
    },
  }

  const url = `${webOrigin}/p/${shortId}${script ? `?from=badgeReview&id=${id}` : ''}`
  return (
    <a href={url} target='_blank' rel='noopener noreferrer' style={styles.root}>
      <img layout='fixed' alt='SMOOOSYロゴ' src={`${webOrigin}/images/logo.png`} height='35' width='140' style={styles.logo} />
      <div style={styles.proLink}>{name}</div>
      <div style={styles.rating}>
        <div style={styles.star}>
          <RatingStar rating={rating} />
        </div>
        <span style={styles.review}>{number}件のレビュー</span>
      </div>
    </a>
  )
}

export default Widget
