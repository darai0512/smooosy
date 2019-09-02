import React from 'react'
import { Link } from 'react-router-dom'
import withWidth from '@material-ui/core/withWidth'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import MobileStepper from '@material-ui/core/MobileStepper'
import { withTheme } from '@material-ui/core/styles'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import withStyles from '@material-ui/core/styles/withStyles'
import storage from 'lib/storage'
import { showIntercom, hideIntercom } from 'lib/intercom'

const proOnBoardingKey = 'proOnBoardingKey'

@withWidth()
@withTheme
@withStyles({
  actions: {
    display: 'block',
    padding: 0,
  },
})
export default class ProOnBoarding extends React.Component {

  static defaultProps = {
    onRef: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {open: !storage.get(proOnBoardingKey), activeStep: 0}
  }

  componentDidMount() {
    this.props.onRef(this)
  }
  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  handleNext = () => {
    if (this.state.activeStep === 4) {
      return this.handleClose()
    }
    this.setState({
      activeStep: this.state.activeStep + 1,
    })
  }

  handleBack = () => {
    this.setState({
      activeStep: this.state.activeStep - 1,
    })
  }

  handleOpen = () => {
    hideIntercom()
    this.setState({open: true, activeStep: 0 })
  }

  handleClose = () => {
    showIntercom()
    storage.save(proOnBoardingKey, true)
    this.setState({open: false, activeStep: 0 })
  }

  render() {
    const { width, theme, classes } = this.props
    const { open, activeStep } = this.state
    const { grey } = theme.palette

    const styles = {
      head: {
        fontSize: 16,
        fontWeight: 'bold',
        margin: width === 'xs' ? '0 0 12px' : '0 24px 24px',
      },
    }

    return (
       <Dialog open={!!open} onClose={this.handleClose}>
         <DialogTitle>
            SMOOOSYにようこそ！
            <IconButton style={{position: 'absolute', top: 0, right: 0}} onClick={this.handleClose}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <div style={{marginBottom: 24}}>
              <div style={styles.head}>
                <div style={{color: activeStep === 0 ? grey[800] : grey[300]}}>1. SMOOOSYは地域のプロと依頼者のマッチングサービスです</div>
                <div style={{color: activeStep === 1 ? grey[800] : grey[300]}}>2. 条件に合った依頼が依頼者から送られてきます</div>
                <div style={{color: activeStep === 2 ? grey[800] : grey[300]}}>3. 依頼に対し応募をします（初回無料）</div>
                <div style={{color: activeStep === 3 ? grey[800] : grey[300]}}>4. 応募後、依頼者と直接依頼の打ち合わせができるようになります</div>
                <div style={{color: activeStep === 4 ? grey[800] : grey[300]}}>5. 月額費・成約手数料は無料です</div>
              </div>
              {activeStep === 0 ?
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <img alt='地図' src='/images/map.png' style={{width: 200, height: 90}}/>
                </div>
              : activeStep === 1 ?
                <div style={{display: 'flex', flexDirection: width === 'xs' ? 'column' : 'row', justifyContent: 'center', alignItems: width === 'xs' ? 'center' : 'flex-start'}}>
                  <img alt='依頼例' src='/images/request.png' style={{marginRight: width === 'xs' ? 0 : 5, border: `1px ${grey[500]} solid`, width: 150, height: 100 }} />
                  <img alt='依頼例詳細' src='/images/request_detail.png' style={{marginTop: width === 'xs' ? 20 : 0, marginLeft: width === 'xs' ? 0 : 5, border: `1px ${grey[500]} solid`, width: 180, height: 224 }} />
                </div>
              : activeStep === 2 ?
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  依頼への応募にはSMOOOSYポイント(応募手数料)の購入が必要です。初回応募時はお試しで無料となっております。応募に必要なSMOOOSYポイントは、依頼の確度に基づいてシステムで算出しているため、案件ごとに異なります。また、1つの依頼に対して最大で5事業者までが応募できます。
                  <Link style={{marginTop: 20}} to='/pro-center/point' target='_blank'>SMOOOSYポイントとは？</Link>
                  <img alt='応募例' src='/images/meets.png' style={{border: `1px ${grey[500]} solid`, marginTop: 20, width: 250, height: 223 }} />
                </div>
              : activeStep === 3 ?
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  応募後、依頼者とチャット形式で依頼の詳細の打ち合わせができます。依頼者が決定すると成約となります。
                  <img alt='成約' src='/images/progress.png' style={{border: `1px ${grey[500]} solid`, marginTop: 20, width: width === 'xs' ? 250 : 400, height: width === 'xs' ? 183 : 294 }} />
                </div>
              :
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <img src='/images/ri_02.svg' style={{width: 72, height: 72}}/>
                  応募時以外の費用はかかりません。ご安心してお使いください。
                </div>
              }
            </div>
          </DialogContent>
          <DialogActions disableSpacing className={classes.actions}>
            <MobileStepper
              variant='dots'
              steps={5}
              position='static'
              activeStep={activeStep}
              nextButton={
                <Button size='small' color='primary' onClick={this.handleNext}>
                  {activeStep === 4 ? '閉じる' : '次へ'}
                  <KeyboardArrowRight />
                </Button>
              }
              backButton={
                <Button size='small' onClick={this.handleBack} disabled={activeStep === 0}>
                  <KeyboardArrowLeft />
                  戻る
                </Button>
              }
            />
          </DialogActions>
      </Dialog>
    )
  }
}
