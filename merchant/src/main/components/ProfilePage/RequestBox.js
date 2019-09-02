import React from 'react'
import { connect } from 'react-redux'
import { Select, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ChatIcon from '@material-ui/icons/Chat'

import GAEventTracker from 'components/GAEventTracker'
import LPButton from 'components/LPButton'
import { default as TextInput } from 'components/form/renderTextInput'
import { GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent
import japaneseNumber from 'lib/japaneseNumber'

const RequestBox = ({classes, selectedService, onClick, providingServices, onSelectService, hasServiceId, price, priceLoading, zip, onBlurZip, zipError, profile, user}) => (
  <div className={classes.quote}>
    <div className={classes.priceBox}>
      {priceLoading ?
        <div className={classes.loading}>
          <img className={classes.loadingImage} src='/images/loading-dot.svg' />
        </div>
      : price && price.total > 0 ?
        <div className={classes.prices}>
          <span className={classes.priceNote}>
            {price.estimatePriceType === 'fixed' ? '見積価格' : '概算価格'}
          </span>
          <span className={classes.price}>
            {japaneseNumber(price.total).format()}円{price.estimatePriceType === 'minimum' ? '〜' : ''}
          </span>
        </div>
      :
        <div className={classes.noPrice}>
          価格を問い合わせる
        </div>
      }
    </div>
    {!hasServiceId &&
      <div className={classes.marginBottom}>
        <label className={classes.itemLabel}>サービスを選択</label>
        <Select
          className={classes.selectService}
          value={selectedService.id}
          onChange={(e) => onSelectService(e.target.value)}
          disableUnderline={true}
        >
          {providingServices.map(s => <MenuItem key={s.key} value={s.id}>{s.name}</MenuItem>)}
        </Select>
      </div>
    }
    <TextInput labelClass={classes.itemLabel} className={classes.marginBottom} defaultValue={zip} label='場所' placeholder='地名・郵便番号を入力' onBlur={(e) => onBlurZip(e.target.value)} meta={{touched: true, error: zipError ? '地名・郵便番号が取得できませんでした' : null}} />
    <GAEventTracker
      category={dialogOpen}
      action={pageType.ProfilePage}
      label={hasServiceId ? selectedService.key : ''}
    >
      <LPButton
        disabled={user.profiles  && user.profiles.includes(profile._id)}
        classes={{root: classes.marginClear}}
        onClick={onClick}
      >
        <ChatIcon className={classes.requestIcon} />
        {(user.profiles && user.profiles.includes(profile._id)) ? '自分は指名できません' : '空き状況を確認する'}
      </LPButton>
    </GAEventTracker>
    <div className={[classes.marginTop, classes.smallText].join(' ')}>成約時のプロへのお支払い以外、無料でサービスをご利用頂けます。</div>
  </div>
)

export default withStyles(theme => ({
  quote: {
    padding: 20,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    borderRadius: 5,
    width: 250,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 50,
    marginTop: 50,
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
      borderWidth: '1px 0px',
      borderStyle: 'solid',
      borderColor: theme.palette.grey[300],
      borderRadius: 0,
    },
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
  },
  selectService: {
    width: '100%',
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: '5px 10px',
    borderRadius: 4,
  },
  marginClear: {
    margin: 0,
  },
  marginTop: {
    marginTop: 20,
  },
  marginBottom: {
    marginBottom: 10,
  },
  smallText: {
    fontSize: 14,
  },
  requestIcon: {
    color: theme.palette.common.white,
    width: 28,
    height: 28,
    marginLeft: -20,
    marginRight: 10,
  },
  priceBox: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  loading: {
    height: 36,
    textAlign: 'left',
  },
  loadingImage: {
    height: '100%',
  },
  prices: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceNote: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  price: {
    fontWeight: 'bold',
  },
  noPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}))(connect(state => ({
  user: state.auth.user,
  profile: state.profile.profile,
}))(RequestBox))
