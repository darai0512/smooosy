import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import PlayCircleIcon from '@material-ui/icons/PlayCircleFilled'

import { imageSizes } from '@smooosy/config'

const MediaList = ({classes, mediaListRef, media, onSelectMedia}) => (
  <div ref={mediaListRef} className={classes.root}>
    <h2 className={classes.title}>写真と動画</h2>
    <h4 className={classes.subtitle}>{`写真${media.filter(m => !m.video).length}件と動画${media.filter(m => m.video).length}件`}</h4>
    <div className={classes.mediaList}>
      {media.slice(0, 6).map((m, i) =>
        <div key={m.id} className={classes.media} onClick={() => onSelectMedia(i)}>
          <img alt={m.text} src={m.url + imageSizes.c160} className={classes.mediaImg} width={100} height={100} />
          {m.type === 'video' && <div className={classes.avPlayCircleFilled}><PlayCircleIcon className={classes.playIcon} /></div>}
          {i === 5 && <div className={classes.showAllCover}>すべて見る</div>}
        </div>
      )}
      {media.length < 6 && [...Array(6 - media.length)].map((_, i) => <div key={`dummy_${i}`} className={classes.mediaDummy} />)}
    </div>
  </div>
)

export default withStyles(theme => ({
  root: {
    marginBottom: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  mediaList: {
    padding: '10px 0',
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    margin: '0 auto',
  },
  media: {
    position: 'relative',
    flex: 1,
    height: 'auto',
    padding: 2,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      padding: 1,
    },
    '&:before': {
      content: '\"\"',
      display: 'block',
      paddingTop: '100%',
    },
  },
  avPlayCircleFilled: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    color: 'rgba(255, 255, 255, .5)',
  },
  playIcon: {
    width: 60,
    height: 60,
    [theme.breakpoints.down('xs')]: {
      width: 30,
      height: 30,
    },
  },
  mediaImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    objectFit: 'cover',
    borderRadius: 5,
    '&:hover': {
      opacity: .8,
    },
  },
  mediaDummy: {
    position: 'relative',
    flex: 1,
    padding: 2,
    [theme.breakpoints.down('xs')]: {
      padding: 1,
    },
  },
  showAllCover: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    top: 2,
    bottom: 2,
    left: 2,
    right: 2,
    background: 'rgba(0, 0, 0, 0.2)',
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: `1px 1px 1px ${theme.palette.common.black}`,
    borderRadius: 5,
    fontSize: 10,
  },
}))(MediaList)
