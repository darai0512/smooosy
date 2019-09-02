
import React from 'react'
import { withStyles } from '@material-ui/core'
import { imageOrigin } from '@smooosy/config'

@withStyles(theme => ({
  explanationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  frame: {
    position: 'relative',
    width: 270,
    height: 514,
    [theme.breakpoints.down('xs')]: {
      width: 190,
      height: 351,
    },
  },
  imageContainer: {
    position: 'absolute',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    width: 270,
    height: 514,
    backgroundImage: `url('/images/iphone.png')`,
    zIndex: 2,
    [theme.breakpoints.down('xs')]: {
      backgroundSize: 'contain',
      width: 190,
      height: 340,
    },
  },
  innerFrame: {
    overflow: 'hidden',
    position: 'absolute',
    top: 52,
    left: 24,
    width: 228,
    height: 408,
    [theme.breakpoints.down('xs')]: {
      top: 36,
      left: 16,
      width: 150,
      height: 270,
    },
  },
  slideImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    left: 225,
    zIndex: 0,
    opacity: 0,
    transition: theme.transitions.create(
      ['left', 'zIndex', 'opacity'],
      { duration: theme.transitions.duration.complex }
    ),
    '&.slideIn': {
      left: 0,
      zIndex: 1,
      opacity: 1,
    },
    '&.slideOut': {
      left: -225,
      zIndex: 0,
      opacity: 0,
    },
  },
  step1: {
    backgroundImage: `url('/images/push.jpg')`,
  },
  step2: {
    backgroundImage: `url('/images/timeline.png')`,
  },
  step3: {
    backgroundImage: `url('/images/booking.png')`,
  },
  stepContainer: {
    margin: '0 0 0 40px',
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto',
    },
  },
  step: {
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    width: 632,
    height: 'auto',
    marginTop: 16,
    padding: '24px 0 24px 29px',
    [theme.breakpoints.down('xs')]: {
      width: 300,
      height: 90,
      marginTop: 4,
      padding: '16px 0 16px 22px',
    },
  },
  stepName: {
    lineHeight: '100%',
    color: theme.palette.grey.G950,
    fontWeight: 'bold',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  stepNum: {
    marginRight: 16,
  },
  content: {
    lineHeight: '150%',
    color: theme.palette.common.black,
    margin: '16px 0 0 30px',
    width: 554,
    height: 21,
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      margin: '8px 0 0 25px',
      width: 238,
      height: 36,
      fontSize: 12,
    },
  },
  first: {
    background: theme.palette.common.white,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    borderLeft: `6px solid ${theme.palette.lightGreen.G550}`,
  },
}))
export default class Mechanism extends React.Component {

  constructor(props) {
    super(props)
    this.timer = setInterval(this.setNextHighlight, 3000)
    this.state = {
      highlightStep: 0,
      prevHighlightStep: 0,
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  setNextHighlight = () => {
    if (this.state.highlightStep === 3) return this.setState({highlightStep: 0, prevHighlightStep: this.state.highlightStep})
    const count = this.state.highlightStep + 1
    this.setState({highlightStep: count, prevHighlightStep: this.state.highlightStep})
  }

  onClick = (idx) => {
    this.setState({highlightStep: idx, prevHighlightStep: this.state.highlightStep})
    clearInterval(this.timer)
    this.timer = setInterval(this.setNextHighlight, 3000)
  }

  render() {
    const { classes } = this.props
    const { highlightStep, prevHighlightStep } = this.state
    const stepArray = [
      {
        stepName: 'ドタキャン発生',
        content: 'サービス詳細や時間、割引率を入力し、募集をかけましょう。事前入力をしておけば素早く対応できます。',
      },
      {
        stepName: '近くの見込み客へ募集',
        content: '位置情報と興味関心判定により、成約可能性が高い見込み客へと順次募集がかかります。',
      },
      {
        stepName: '新しい予約が成立',
        content: '事前決済により確実に収益が見込めます。予定通り、お客様をオモテナシしましょう。',
      },
    ]

    return (
        <div className={classes.explanationContainer}>
          <div className={classes.stepContainer}>
            {stepArray.map((step, idx) =>
              <Step key={step.stepName} {...step} stepNum={idx} highlight={idx === highlightStep} onClick={this.onClick} />
            )}
          </div>
        </div>
    )
  }
}


const Step = withStyles((theme) => ({
  wrapper: {
    position: 'relative',
  },
  border: {
    position: 'absolute',
    width: 6,
    height: 0,
    borderRadius: 16,
    backgroundColor: theme.palette.lightGreen.G550,
  },
  borderAnim: {
    animation: '$borderAnimation 3s ease 1 forwards',
  },
  '@keyframes borderAnimation': {
    '0%': {height: '0%'},
    '100%': {height: '100%'},
  },
  highlight: {
    background: theme.palette.common.white,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
  },
  step: {
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    width: 632,
    height: 'auto',
    marginTop: 16,
    padding: '24px 0 24px 29px',
    [theme.breakpoints.down('xs')]: {
      width: 300,
      height: 90,
      marginTop: 4,
      padding: '16px 0 16px 22px',
    },
  },
  stepName: {
    lineHeight: '100%',
    color: theme.palette.grey.G950,
    fontWeight: 'bold',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  stepNum: {
    marginRight: 16,
  },
  content: {
    lineHeight: '150%',
    color: theme.palette.common.black,
    margin: '16px 0 0 30px',
    width: 554,
    height: 21,
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      margin: '8px 0 0 25px',
      width: 238,
      height: 36,
      fontSize: 12,
    },
  },
}))(({classes, stepName, stepNum, content, highlight, onClick}) => (
  <div className={classes.wrapper}>
    <div className={[classes.border, highlight ? classes.borderAnim : ''].join(' ')} />
    <div className={[classes.step, highlight ? classes.highlight : ''].join(' ')} onClick={() => onClick(stepNum)} >
      <h3 className={classes.stepName}><span className={classes.stepNum}>{stepNum + 1}</span>{stepName}</h3>
      <p className={classes.content}>{content}</p>
    </div>
  </div>
))
