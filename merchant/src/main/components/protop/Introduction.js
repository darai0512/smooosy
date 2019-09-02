
import React from 'react'
import { withStyles, Button } from '@material-ui/core'
import SignupPage from 'components/SignupPage'
import { imageOrigin } from '@smooosy/config'
import { red } from '@material-ui/core/colors'

export const Introduction = withStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    height: 595,
    background: 'rgba(223, 237, 192, 0.14)',
    paddingLeft: 24,
    paddingRight: 100,
  },
  introContainer: {
    padding: '0 20px 0 10px',
    marginRight: 120,
    [theme.breakpoints.down('sm')]: {
      marginRight: 10,
    },
  },
  title: {
    width: '320px',
  },
  description: {
    fontSize: 14,
    marginTop: 14,
    lineHeight: '16px',
    fontWeight: 'normal',
    color: theme.palette.grey.G550,
  },
  question: {
    margin: '32px 0 16px 0',
    color: theme.palette.common.black,
    lineHeight: '16px',
    fontSize: 14,
    fontWeight: 'bold',
  },

  formContainer: {
    alignItems: 'center',
    width: 304,
    borderRadius: 4,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    width: 24,
    height: 24,
    top: 14,
    left: 18,
    color: '#1678BE',
  },
  locationInput: {
    height: 48,
    borderTop: 'none',
    borderLeft: '1px solid #E4E4E4',
    borderRight: '1px solid #E4E4E4',
    borderBottom: '1px solid #E4E4E4',
    outline: 'none',
    padding: '5px 50px 5px 50px',
    fontSize: 14,
    marginBottom: 0,
    width: '100%',
    '&:focus': {
      border: `2px solid ${theme.palette.primary.main}`,
    },
  },
  sendButton: {
    fontWeight: 'bold',
    background: theme.palette.lightGreen.G550,
    color: theme.palette.common.white,
    width: '100%',
    borderRadius: '0px 0px 4px 4px',
    boxShadow: 'none',
    '&:hover': {
      background: theme.palette.lightGreen.G450,
    },
  },

  signupNum: {
    fontSize: 14,
    marginTop: 34,
    lineHeight: '16px',
    fontWeight: 'bold',
    color: theme.palette.grey.G550,
    display: 'inline-block',
  },
  num: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  underline: {
    background: '#E8E8E8',
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },

  imageContainer: {
    position: 'relative',
    width: 344,
    height: 425,
  },
  darkGreenRectangle: {
    position: 'absolute',
    top: -20,
    left: 62,
    width: 304,
    height: 351,
    background: '#1A237E',
    borderRadius: 4,
  },
  greenRectangle: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 304,
    height: 351,
    background: '#F63355',
    borderRadius: 4,
  },
  greenLogo: {
    position: 'absolute',
    width: 283,
    height: 324,
    left: -185,
    top: 188,
    backgroundImage: `url('${imageOrigin}/static/protop/pc-green-logo.png')`,
    backgroundRepeat: 'no-repeat',
    zIndex: -2,
  },
  blueLogo: {
    zIndex: -2,
    position: 'absolute',
    width: 330,
    height: 350,
    left: 214,
    bottom: 248,
    backgroundImage: `url('${imageOrigin}/static/protop/pc-blue-logo.png')`,
    backgroundRepeat: 'no-repeat',
  },
  error: {
    color: red[500],
  },
}))(({ classes, search, onSelect, onSuggest, onClick, setLocation, error }) =>
  <div className={classes.container}>
    <div className={classes.introContainer}>

      <h1 className={classes.title}>SMOOOSYで人件費のロスを防ぎましょう</h1>
      <p className={classes.description}>SMOOOSYは近くのお客様に即座にリーチできるプラットフォームです。<br/>
      まずは無料で登録してみましょう。</p>
      <SignupPage/>
      {error && <div className={classes.error}>{error}</div>}

      <p className={classes.signupNum}>
        <span>登録事業者数</span>
        <span className={classes.num}>20,000</span>
        <div className={classes.underline} />
      </p>

    </div>

    <div className={classes.imageContainer}>
      <div className={classes.blueLogo} />
      <div className={classes.greenLogo} />
      <div className={classes.darkGreenRectangle} />
      <div className={classes.greenRectangle} />
      <CoverImage />
    </div>

  </div>
)

const IMAGE_LENGTH = 3
const STOP_DURATION_SEC = 2
const ANIMATION_DURATION_SEC = 0.5
const IMAGE_DURATION_SEC = STOP_DURATION_SEC + ANIMATION_DURATION_SEC
const TOTAL_DURATION_SEC = IMAGE_LENGTH * IMAGE_DURATION_SEC

const CoverImage = withStyles({
  coverImage: {
    width: 344,
    height: 425,
    position: 'absolute',
    boxShadow: '0px 24px 32px rgba(0,0,0,0.1)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: 4,
    animation: `$fadeInOut ${TOTAL_DURATION_SEC}s linear infinite`,
  },
  image1: {
    backgroundImage: `url('/images/smooosy_with_logo.png')`,
    animationDelay: `${IMAGE_DURATION_SEC * 2}s`,
  },
  image2: {
    backgroundImage: `url('/images/timeline.png')`,
    animationDelay: `${IMAGE_DURATION_SEC}s`,
  },
  image3: {
    backgroundImage: `url('/images/booking.png')`,
    animationDelay: '0s',
  },
  '@keyframes fadeInOut': {
    '0%': { opacity: 1},
    [`${STOP_DURATION_SEC / TOTAL_DURATION_SEC * 100}%`]: {opacity: 1},
    [`${1 / IMAGE_LENGTH * 100}%`]: {opacity: 0},
    [`${(1 - ANIMATION_DURATION_SEC / TOTAL_DURATION_SEC) * 100}%`]: {opacity: 0},
    '100%': {opacity: 1},
  },
})(
  ({classes}) => {
    return (
      <>
       {[...new Array(IMAGE_LENGTH)].map((_, idx) =>
         <div key={`cover_${idx}`} className={[classes.coverImage, classes[`image${idx+1}`]].join(' ')} />
       )}
      </>
    )
  }
)

export const IntroductionMobile = withStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: '0 auto',
    height: 414,
    background: 'rgba(223, 237, 192, 0.14)',
    padding: '0 10px 0 10px',
    backgroundImage: `url("${imageOrigin}/static/protop/mobile-green-logo.png"), url("${imageOrigin}/static/protop/mobile-blue-logo.png")`,
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'bottom -72px left 0, top -25px right 0',
  },
  title: {
    width: 310,
    fontSize: 28,
    textAlign: 'center',
    margin: '0 auto 24px',
  },
  formContainer: {
    borderRadius: 4,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    width: 24,
    height: 24,
    top: 14,
    left: 18,
    color: '#1678BE',
  },
  locationInput: {
    height: 48,
    borderTop: 'none',
    borderLeft: '1px solid #E4E4E4',
    borderRight: '1px solid #E4E4E4',
    borderBottom: '1px solid #E4E4E4',
    outline: 'none',
    padding: '5px 50px 5px 50px',
    fontSize: 14,
    marginBottom: 0,
    width: '100%',
    '-webkit-appearance': 'none',
    borderRadius: 0,
    '&:focus': {
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: 'none',
    },
  },
  sendButton: {
    fontWeight: 'bold',
    background: theme.palette.lightGreen.G550,
    color: theme.palette.common.white,
    width: '100%',
    borderRadius: '0px 0px 4px 4px',
    boxShadow: 'none',
    '&:hover': {
      background: theme.palette.lightGreen.G450,
    },
  },

  signupInfo: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  signupNum: {
    fontSize: 16,
    marginTop: 14,
    lineHeight: '19px',
    fontWeight: 'bold',
    color: theme.palette.grey.G550,
    display: 'inline-block',
  },
  num: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  underline: {
    background: '#E8E8E8',
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  error: {
    color: red[500],
  },
}))(({classes, search, onSelect, onSuggest, onClick, setLocation, error}) => (
  <div className={classes.container}>
    <div>
      <h1 className={classes.title}>SMOOOSYで<br />人件費のロスを防ぎましょう</h1>
      <SignupPage/>
      {error && <div className={classes.error}>{error}</div>}

      <div className={classes.signupInfo}>
        <p className={classes.signupNum}>
          <span>登録事業者数</span>
          <span className={classes.num}>20,000</span>
          <div className={classes.underline} />
        </p>
      </div>

    </div>
  </div>
))
