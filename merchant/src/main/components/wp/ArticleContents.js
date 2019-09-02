import React from 'react'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'
import { Link } from 'react-router-dom'

import SocialButtons from 'components/SocialButtons'
import MediaPro from 'components/MediaPro'
import ServicePricePaper from 'components/ServicePricePaper'
import ProIntroduction from 'components/ProIntroduction'
import { LazyLoadImage } from 'components/LazyLoad'
import { GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType: pageTypes } = GAEvent


let ArticleContents = props => {
  const { doms, author, authorId, published, modified, currentPath, matchMorePath, serviceOrCategory, pageType, prefLocationServices, isPreview, classes } = props
  const gaEvent = serviceOrCategory ? { category: dialogOpen, action: pageType, label: serviceOrCategory.key } : {}

  return (
    <article className={classes.root}>
      <div className={classes.head}>
        {!isPreview && <SocialButtons size='large' />}
        <div className={classes.space} />
        <div className={classes.info}>
          最終更新日: {moment(modified).format('YYYY年MM月DD日')}
        </div>
      </div>
      {doms.map(d => {
        if (d.component) {
          switch (d.component) {
            case 'pro':
              if (!d.props.profileId) return null
              return (
                <MediaPro
                  key={d.id}
                  currentPath={matchMorePath || currentPath}
                  src={d.props.src}
                  label={d.props.label}
                  desc={d.props.desc}
                  size={60}
                  gaEvent={gaEvent}
                  profileId={d.props.profileId}
                  hideButton={pageType === pageTypes.ProArticlePage}
                  buttonProps={profileId => ({component: Link, to: matchMorePath || `${currentPath}?modal=true&sp=${profileId}&source=mediapro`})}
                />
              )
            case 'intro':
              if (!d.props.introduction) return null
              return (
                <ProIntroduction
                  key={d.id}
                  introduction={d.props.introduction}
                  gaEvent={gaEvent}
                  buttonProps={profileId => ({component: Link, to: matchMorePath || `${currentPath}?modal=true&sp=${profileId}&source=prointroduction`})}
                  prefLocationServices={prefLocationServices}
                />
              )
            case 'price':
              if (!d.props.price || !d.props.service) return null
              return (
                <div key={d.id} className={classes.priceChart}>
                  <ServicePricePaper
                    price={d.props.price}
                    service={d.props.service}
                  />
                </div>
              )
          }
        } else if (d.dom) {
          return (
            <div key={d.id} className='entry-content' dangerouslySetInnerHTML={{__html: d.dom}} />
          )
        }

        return null
      })}
      {!isPreview && <div style={{marginBottom: 10}}>
        <SocialButtons size='large' />
      </div>}
      {serviceOrCategory && serviceOrCategory.name &&
        <aside className={classes.info}>
          カテゴリ: <Link to={currentPath.replace(/\/\d+$/, '')}>{serviceOrCategory.name}</Link>
        </aside>
      }
      {author && authorId &&
        <aside className={classes.info}>
          {moment(published).format('YYYY年MM月DD日')} By <Link to={`/articles/authors/${authorId}`}>{author.display_name}</Link>
          {author.description &&
            <div className={classes.authorCard}>
              <div>
                <LazyLoadImage src={author.avatar} width={90} height={90} />
              </div>
              <div className={classes.authorInfo}>
                <h3>著者紹介: {author.display_name}</h3>
                <p>{author.description}</p>
              </div>
            </div>
          }
        </aside>
      }
    </article>
  )
}

ArticleContents = withStyles(theme => ({
  root: {
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      margin: '0 auto',
    },
  },
  info: {
    display: 'block',
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 10,
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  head: {
    display: 'flex',
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  space: {
    flex: 1,
  },
  zipbanner: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 60,
  },
  priceChart: {
    display: 'flex',
    justifyContent: 'center',
  },
  authorCard: {
    display: 'flex',
    padding: 20,
    border: `1px solid ${theme.palette.grey[500]}`,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
  authorInfo: {
    marginLeft: 10,
    width: '100%',
  },
}))(ArticleContents)

export default ArticleContents
