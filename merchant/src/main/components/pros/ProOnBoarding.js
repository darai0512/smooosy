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
    if (this.state.activeStep === 3) {
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
                <div style={{color: activeStep === 0 ? grey[800] : grey[300]}}>1. SMOOOSYはお店と近くにいる見込み客とのマッチングサービスです</div>
                <div style={{color: activeStep === 1 ? grey[800] : grey[300]}}>2. ドタキャン発生時など、お好きなタイミングで募集をかけられます（無料）</div>
                <div style={{color: activeStep === 2 ? grey[800] : grey[300]}}>3. 成約後はお客様とのメッセージ・通話が可能です</div>
                <div style={{color: activeStep === 3 ? grey[800] : grey[300]}}>4. 月額10,000円・成約手数料は5%です</div>
              </div>
              {activeStep === 0 ?
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <img alt='地図' src='/images/map.png' style={{width: 200, height: 90}}/>
                </div>
              : activeStep === 1 ?
                <div style={{display: 'flex', flexDirection: width === 'xs' ? 'column' : 'row', justifyContent: 'center', alignItems: width === 'xs' ? 'center' : 'flex-start'}}>
                  <img alt='依頼例詳細' src='/images/request_detail.png' style={{marginTop: width === 'xs' ? 20 : 0, marginLeft: width === 'xs' ? 0 : 5, border: `1px ${grey[500]} solid`, width: 210, height: 180 }} />
                </div>
              : activeStep === 2 ?
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <img alt='成約' src='/images/progress.png' style={{border: `1px ${grey[500]} solid`, marginTop: 20, width: width === 'xs' ? 250 : 400, height: width === 'xs' ? 183 : 294 }} />
                </div>
              :
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <img src='/images/ri_02.svg' style={{width: 72, height: 72}}/>
                  登録は無料で、サービス利用時のみ有料となります。必要な時にご利用ください。
                </div>
              }
            </div>
          </DialogContent>
          <DialogActions disableSpacing className={classes.actions}>
            <MobileStepper
              variant='dots'
              steps={4}
              position='static'
              activeStep={activeStep}
              nextButton={
                <Button size='small' color='primary' onClick={this.handleNext}>
                  {activeStep === 3 ? '閉じる' : '次へ'}
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
