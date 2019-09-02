import React from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { CircularProgress, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import UserAvatar from 'components/UserAvatar'
import InstantResult from 'components/InstantResult'

export default compose(
  withStyles(theme => ({
    emptyMessage: {
      padding: 20,
    },
    emptyButton: {
      marginBottom: 20,
    },
    subTitle: {
      fontWeight: 'bold',
      padding: '20px 0',
      borderBottom: `1px solid ${theme.palette.grey[300]}`,
      marginBottom: 10,
      [theme.breakpoints.down('xs')]: {
        paddingLeft: 10,
      },
    },
    contacted: {
      borderBottom: `1px solid ${theme.palette.grey[300]}`,
    },
    contactedHeader: {
      display: 'flex',
      alignItems: 'center',
      paddingBottom: 10,
      cursor: 'pointer',
      [theme.breakpoints.down('xs')]: {
        padding: 10,
      },
    },
    contactedTitle: {
      fontWeight: 'bold',
      padding: 10,
      fontSize: 16,
      [theme.breakpoints.down('xs')]: {
        fontSize: 14,
      },
    },
    space: {
      flex: 1,
    },
    results: {
      width: '100%',
      maxWidth: 700,
      [theme.breakpoints.down('xs')]: {
        padding: 0,
      },
    },
    loading: {
      height: '100%',
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    instantResult: {
      background: theme.palette.common.white,
      paddingBottom: 20,
      marginBottom: 20,
      borderBottom: `1px solid ${theme.palette.grey[300]}`,
      [theme.breakpoints.down('xs')]: {
        border: 'none',
        borderRadius: '5px',
        boxShadow: '0px 1px 6px rgba(32, 33, 36, 0.28)',
        marginBottom: 8,
        paddingBottom: 0,
      },
    },
    notFound: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    ppaButton: {
      marginTop: 10,
      marginBottom: 40,
    },
    visibleButton: {
      [theme.breakpoints.down('xs')]: {
        padding: 0,
        fontSize: 14,
      },
    },
    instantResultWrap: {
      [theme.breakpoints.down('xs')]: {
        padding: '8px 8px 0',
      },
    },
  })),
  connect(
    state => ({
      instantResults: state.proService.instantResults,
      request: state.proService.request,
    })
  )
)(({ service, instantResults, request, classes, queryParams, loading, getAddressFromGPS, openContacted, setOpenContacted, openDialog, onClickProfile, onClickSeeProfile }) => {
  if (!service) return null

  const proServicesWithMeet = []
  const proServicesWithSpecialSent = []
  const proServices = []
  if (instantResults) {
    for (let ps of instantResults) {
      if (ps.existingMeet) {
        proServicesWithMeet.push(ps)
      } else if (request && request.specialSent.find(ss => ss === ps.profile._id)) {
        proServicesWithSpecialSent.push(ps)
      } else {
        proServices.push(ps)
      }
    }
  }
  const proServicesWithExistMeet = proServicesWithMeet.filter(ps => ps.existingMeet.proResponseStatus !== 'decline')

  return (
    <div className={classes.results}>
    {(proServicesWithMeet.length + proServicesWithSpecialSent.length) > 0 &&
      <div className={openContacted ? null : classes.contacted}>
        <div className={classes.contactedHeader} onClick={setOpenContacted}>
          {proServicesWithExistMeet.slice(0, 2).map(proService =>
            <UserAvatar size={32} key={proService._id} user={proService.user} />
          )}
          <div className={classes.contactedTitle}>{`マッチ中のプロ(${(proServicesWithExistMeet.length + proServicesWithSpecialSent.length)})`}</div>
          <div className={classes.space} />
          {proServicesWithExistMeet.length > 0 &&
            <Button className={classes.visibleButton} color='primary'>
              {openContacted ? '隠す' : '表示する'}
            </Button>
          }
        </div>
        {openContacted && [...proServicesWithExistMeet, ...proServicesWithSpecialSent].map((proService, idx) =>
          <InstantResult
            key={proService._id}
            proService={proService}
            className={classes.instantResult}
            onClick={openDialog}
            queryParams={queryParams}
            loading={loading}
            withRequest={!!request}
            isLast={idx === proServicesWithExistMeet.length - 1 ? true : false}
            specialSent={true}
            onClickProfile={onClickProfile}
            onClickSeeProfile={onClickSeeProfile}
          />
        )}
      </div>
    }
    {request &&
      <div className={classes.subTitle}>さらに条件の合うプロ</div>
    }
    {!instantResults && loading ?
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    : !queryParams.zip ?
      <div className={classes.notFound}>
        <div className={classes.emptyMessage}>検索欄から住所・郵便番号を入力することで近くのプロを検索できます。</div>
        <Button className={classes.emptyButton} size='medium' variant='contained' color='primary' onClick={getAddressFromGPS}>現在地から検索</Button>
      </div>
    : !instantResults || proServices.length === 0 ?
      <div className={classes.notFound}>
        <div>条件に合う{service.providerName}が見つかりませんでした。</div>
        <div>依頼したい情報を入力すると、条件に合う{service.providerName}を代わりにお探しすることも可能です。</div>
        <Button className={classes.ppaButton} variant='contained' color='primary' onClick={() => openDialog(null)}>依頼したい情報を入力する</Button>
      </div>
    :
      <div className={classes.instantResultWrap}>
        {proServices.map(proService =>
          <InstantResult
            key={proService._id}
            proService={proService}
            service={service}
            className={classes.instantResult}
            onClick={openDialog}
            queryParams={queryParams}
            loading={loading}
            withRequest={!!request}
            onClickProfile={onClickProfile}
            onClickSeeProfile={onClickSeeProfile}
          />
        )}
      </div>
    }
    </div>
  )
})
