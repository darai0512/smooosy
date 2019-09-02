
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Hidden } from '@material-ui/core'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import ServicePricePaper from 'components/ServicePricePaper'
import PickupProfiles from 'components/PickupProfiles'
import PickupProAnswer from 'components/PickupProAnswer'
import RequestPaper from 'components/RequestPaper'
import MeetPapers from 'components/MeetPapers'
import GridPageInformation from 'components/GridPageInformation'
import ServiceProMedia from 'components/ServiceProMedia'
import Conversion from 'components/Conversion'
import PickupMedia from 'components/PickupMedia'
import MediaSiteArticles from 'components/MediaSiteArticles'
import ReadMoreWithCSS from 'components/ReadMoreWithCSS'

const ZipOption = ({service, currentPath, onZipEnter, pageType, matchMoreEnabled, component, classes}) => (
  <div className={classes.center}>
    <Conversion
      service={service}
      currentPath={currentPath}
      onZipEnter={onZipEnter}
      matchMoreEnabled={matchMoreEnabled}
      ga={{
        pageType,
      }}
      position={component}
    />
  </div>
)

const pickupMediaUnit = 3

let GridPageLayout = (props) => {
  const {
    pageLayout, classes, // base
    ZipBoxProps, // zipbox
    priceProps, // price
    pickupProfilesProps, // pickupProfiles
    pickupProAnswersProps, // pickupProAnswers
    requestExampleProps, // requestExample
    pageDescriptionProps, // pageDescriptionProps
    pageInformationProps, // pageInformationProps
    proMediaProps, // proMediaProps
    pickupMediaProps, // pickupMediaProps
    articleProps, // articleProps
  } = props

  if (!pageLayout || !pageLayout.layout) {
    return
  }

  let pickupMediaCount = 0
  let grey = true

  return (
    <div className={classes.root}>
      {pageLayout.layout.map((info, i) => {
        const options = info.options || {}
        const hasZipbox = options.zipbox
        const hasPrice = options.price
        const hasPickupMedia = options.pickupMedia

        if (info.type === 'pageDescription' && pageDescriptionProps && pageDescriptionProps.service && pageDescriptionProps.description) {
          grey = !grey
          if (hasPickupMedia) pickupMediaCount++
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='section' className={classes.fullWidth}>
              <SubHeader>{pageDescriptionProps.service.providerName}登録数、日本最大級！</SubHeader>
              <div className={classes.pageDescription}>
                {pageDescriptionProps.description && pageDescriptionProps.description.split('\n').map((p, i) => <p key={i} className={classes.descLine}>{p}</p>)}
              </div>
              {hasPrice && <ServicePricePaper {...priceProps} />}
              {hasPickupMedia && <PickupMedia className={classes.pickupMedia} pickupMedia={pickupMediaProps.pickupMedia.slice((pickupMediaCount - 1) * pickupMediaUnit, pickupMediaCount * pickupMediaUnit)} />}
              {hasZipbox && <ZipOption component={info.type} {...props} />}
            </Container>
          )
        }
        if (info.type === 'pickupProfiles' && pickupProfilesProps && (pickupProfilesProps.profiles.length > 0 || pickupProfilesProps.leads.length > 0)) {
          const { service, profiles } = pickupProfilesProps
          grey = !grey
          if (hasPickupMedia) pickupMediaCount++
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='section' className={classes.fullWidth}>
              <SubHeader>
                {service.name} おすすめプロ{profiles.length > 2 ? ` ${profiles.length}選`: ''}
              </SubHeader>
              <Hidden implementation='css' smUp>
                <ReadMoreWithCSS height={1350} backgroundColor={grey ? 'grey' : ''}>
                  <PickupProfiles {...pickupProfilesProps} />
                </ReadMoreWithCSS>
              </Hidden>
              <Hidden implementation='css' xsDown>
                <PickupProfiles  {...pickupProfilesProps} />
              </Hidden>
              {hasPrice && <ServicePricePaper {...priceProps} />}
              {hasPickupMedia && <PickupMedia className={classes.pickupMedia} pickupMedia={pickupMediaProps.pickupMedia.slice((pickupMediaCount - 1) * pickupMediaUnit, pickupMediaCount * pickupMediaUnit)} />}
              {hasZipbox && <ZipOption component={info.type} {...props} />}
            </Container>
          )
        }
        if (info.type === 'pickupProAnswers' && pickupProAnswersProps && (pickupProAnswersProps.proQuestions || []).filter(pq => pq.answers.length).length > 0) {
          grey = !grey
          if (hasPickupMedia) pickupMediaCount++
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='section' className={classes.fullWidth}>
              <SubHeader>よくある質問</SubHeader>
              <PickupProAnswer proQuestions={pickupProAnswersProps.proQuestions} className={{root: classes.pickupProAnswers}}/>
              {hasPrice && <ServicePricePaper {...priceProps} />}
              {hasPickupMedia && <PickupMedia className={classes.pickupMedia} pickupMedia={pickupMediaProps.pickupMedia.slice((pickupMediaCount - 1) * pickupMediaUnit, pickupMediaCount * pickupMediaUnit)} />}
              {hasZipbox && <ZipOption component={info.type} {...props} />}
            </Container>
          )
        }
        if (info.type === 'requestExample' && requestExampleProps && requestExampleProps.request && requestExampleProps.service) {
          const { request, service } = requestExampleProps
          grey = !grey
          if (hasPickupMedia) pickupMediaCount++
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='section' className={classes.fullWidth}>
              <SubHeader>実際の依頼例</SubHeader>
              <RequestPaper request={{...request, service}} className={classes.requestPaper} />
              <h3 className={classes.requestTitle}>
                {request.meets.length}人の{service.providerName}から見積もりが来ました
              </h3>
              <MeetPapers meets={request.meets} averagePrice={request.averagePrice} service={service} customer={request.customer} />
              {hasPrice && <ServicePricePaper {...priceProps} />}
              {hasPickupMedia && <PickupMedia className={classes.pickupMedia} pickupMedia={pickupMediaProps.pickupMedia.slice((pickupMediaCount - 1) * pickupMediaUnit, pickupMediaCount * pickupMediaUnit)} />}
              {hasZipbox && <ZipOption component={info.type} {...props} />}
            </Container>
          )
        }
        if (info.type === 'proMedia' && proMediaProps && proMediaProps.media.length > 5) {
          const { service } = proMediaProps
          grey = !grey
          if (hasPickupMedia) pickupMediaCount++
          return (
            <Container grey={grey} key={`${info.type}_${i}`} className={classes.fullWidth}>
              <SubHeader>{service.providerName}の写真一覧</SubHeader>
              <ServiceProMedia
                className={classes.contents}
                {...proMediaProps}
              />
              {hasPrice && <ServicePricePaper {...priceProps} />}
              {hasPickupMedia && <PickupMedia className={classes.pickupMedia} pickupMedia={pickupMediaProps.pickupMedia.slice((pickupMediaCount - 1) * pickupMediaUnit, pickupMediaCount * pickupMediaUnit)} />}
              {hasZipbox && <ZipOption component={info.type} {...props} />}
            </Container>
          )
        }
        if (info.type === 'pageInformation' && pageInformationProps && pageInformationProps.pageInformation) {
          grey = !grey
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='section' className={classes.fullWidth}>
              <GridPageInformation
                information={pageInformationProps.pageInformation}
                ZipBoxProps={ZipBoxProps}
              />
            </Container>
          )
        }
        if (info.type === 'mediaSiteArticles' && articleProps && articleProps.articles && articleProps.articles.length > 0) {
          const { service, category } = props
          grey = !grey
          return (
            <Container key={`${info.type}_${i}`} grey={grey} type='aside' className={classes.fullWidth}>
              <SubHeader>{service ? `${service.name}に関する記事` : category ? `${category.name}に関する記事` : 'SMOOOSYメディア'}</SubHeader>
              <MediaSiteArticles articles={articleProps.articles} />
            </Container>
          )
        }

      })}
    </div>
  )
}

GridPageLayout = withStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '10px auto 30px',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      margin: '0 auto 10px',
    },
  },
  pageDescription: {
    width: '90%',
    margin: '0px auto',
    padding: 10,
    fontSize: 15,
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  pickupProAnswers: {
    width: '90%',
    marginRight: '5%',
    marginLeft: '5%',
    marginBottom: 30,
  },
  contents: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: '24px 0 32px',
    [theme.breakpoints.down('xs')]: {
      padding: '16px 0',
    },
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
  },
  pickupMedia: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    padding: '24px 0 32px',
    [theme.breakpoints.down('xs')]: {
      padding: '16px 0',
    },
  },
  fullWidth: {
    width: '100%',
  },
  requestTitle: {
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  requestPaper: {
    margin: '20px auto 40px',
  },
}))(GridPageLayout)

export default GridPageLayout
