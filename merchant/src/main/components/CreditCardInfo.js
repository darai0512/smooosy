import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core'
import { Button, DialogContent } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import Notice from 'components/Notice'
import CreditCard from 'components/CreditCard'
import ConfirmDialog from 'components/ConfirmDialog'
import ResponsiveDialog from 'components/ResponsiveDialog'
import CreditCardInput from 'components/CreditCardInput'
import { addCard, removeCard } from 'modules/point'
import { update as updateUser, load as loadUser } from 'modules/auth'
import { paymentInfo } from 'modules/point'

@withStyles(() => ({
  box: {
    padding: 10,
    display: 'flex',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  right: {
    flex: 1,
    textAlign: 'right',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
@connect(
  state => ({
    defaultCard: state.point.defaultCard,
    user: state.auth.user,
  }),
  { addCard, updateUser, removeCard, loadUser, paymentInfo }
)
export default class CreditCardInfo extends React.Component {
  static defaultProps = {
    onCreated: () => {},
    onRemoved: () => {},
  }

  componentDidMount() {
    this.props.paymentInfo()
  }

  constructor(props) {
    super(props)
    this.state = {
      cardResult: false,
      cardMessage: '',
      open: false,
    }
  }

  onCreated = ({id}) => {
    const body = {}
    if (id) body.token = id
    this.setState({open: false})
    this.props.addCard(body)
      .then(() => {
        this.props.loadUser()
        this.props.onCreated()
      })
      .catch(err => {
        this.setState({errorMessage: err.data.message})
      })
  }

  removeCard = (card) => {
    this.props.removeCard(card.id).then(() => {
      this.setState({
        cardModal: false,
        cardResult: 'info',
        cardMessage: '削除しました',
      })
      this.props.onRemoved && this.props.onRemoved()

      setTimeout(() => this.setState({cardResult: false}), 3000)
    })
  }

  render () {
    const { defaultCard, classes, user: { isMatchMore }, showRemoveButton } = this.props
    const { cardResult, cardMessage, open, errorMessage } = this.state

    return (
      <>
        <div style={{padding: 10}}>
          <div>登録クレジットカード</div>
          {cardResult &&
            <Notice type={cardResult}>{cardMessage}</Notice>
          }
          <div className={classes.box}>
            <div className={classes.left} />
              {defaultCard ?
                <CreditCard info={defaultCard} />
              :
                <div className={classes.center}>
                  <div>未登録</div>
                  <div className={classes.add}>
                    <Button classes={{root: classes.button}} size='medium' variant='contained' color='primary' onClick={() => this.setState({open: true})}>クレジットカードを登録</Button>
                  </div>
                </div>
              }
            <div className={classes.right}>
              {defaultCard && showRemoveButton &&
                <a onClick={() => this.setState({cardModal: true})} style={{fontSize: 13}}>削除</a>
              }
            </div>
            {errorMessage && <div style={{color: red[500]}}>{this.state.errorMessage}</div>}
          </div>
        </div>
        <ResponsiveDialog
            open={!!open}
            onClose={() => this.setState({open: false})}
            title='クレジットカード登録'
          >
          <DialogContent>
            <CreditCardInput onCreated={this.onCreated} label='登録する' />
          </DialogContent>
        </ResponsiveDialog>
        <ConfirmDialog
          open={!!this.state.cardModal}
          title={`このカード情報を削除しますか？ ${isMatchMore ? 'ラクラクお得モードはOFFになります。' : ''}`}
          onSubmit={() => this.removeCard(defaultCard)}
          onClose={() => this.setState({cardModal: false})}
        >
          <CreditCard info={defaultCard} />
        </ConfirmDialog>
      </>
    )
  }
}