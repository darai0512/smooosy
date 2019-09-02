import React from 'react'
import { connect } from 'react-redux'
import { Button, Dialog, DialogContent } from '@material-ui/core'
import { withWidth, withTheme } from '@material-ui/core'
import { amber } from '@material-ui/core/colors'
import StarIcon from '@material-ui/icons/Stars'

import ReviewRequestForm from 'components/ReviewRequestForm'

@withWidth()
@withTheme
@connect(
  state => ({
    user: state.auth.user,
  })
)
export default class ReviewRequest extends React.Component {
  state = {}
  render() {
    const { width, theme, user, profile } = this.props
    const { common, grey } = theme.palette
    const styles = {
      root: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
        marginBottom: 40,
        padding: 20,
        display: width !== 'xs' && 'flex',
        alignItems: 'center',
        borderRadius: 5,
      },
      star: {
        color: amber[700],
        width: 50,
        height: 50,
      },
    }

    return (
      <div>
        <div style={styles.root}>
          <StarIcon style={styles.star} />
          <div style={{flex: 1, margin: '0 10px'}}>
            <p style={{fontSize: 18}}>クチコミを獲得して、成約率を上げましょう！</p>
            <p style={{fontSize: 14, color: grey[700]}}>SMOOOSYの顧客でなくてもクチコミできます</p>
          </div>
          <Button onClick={() => this.setState({requestReview: true})} variant='contained' color='primary'>クチコミを依頼する</Button>
        </div>
        <Dialog open={!!this.state.requestReview} onClose={() => this.setState({requestReview: false})}>
          <DialogContent>
            <h3>過去の顧客にクチコミを依頼しましょう</h3>
            <div>SMOOOSY以外の顧客でも大丈夫です。</div>
            <ReviewRequestForm pro={user} profile={profile} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}
