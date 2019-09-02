
import React from 'react'
import { withStyles } from '@material-ui/core'
import { univOrigin, imageOrigin } from '@smooosy/config'
import PagerPapers from 'components/PagerPapers'


const feedbackList = [
  {
    title: '獲得した顧問契約は500万円超。依頼の多さとコスパのよさに驚く',
    content: 'コストパフォーマンスが非常に良いのがSMOOOSYで驚いたことの一つです。税理士がお客さまを探すのは時間も労力も限られます。ネットを利用してベストな出会いが可能になる現代ならではのツールですね。',
    image: 'hara',
    proName: '原・久川会計事務所平塚橋事務所',
    link: `${univOrigin}/posts/tax-accountant/79521`,
  },
  {
    title: '長らく目標にしていた「東京で写真事務所を開く」ことが実現',
    content: 'SMOOOSYで受注が続いたことが目標を叶えるきっかけになりました。定期的に仕事が入るメドがつき、撮影案件も安定的に見込めるようになりました。「今なら東京で勝負できるのではないか？」と決心しました。',
    image: 'kubota',
    proName: '久保田 翔也',
    link: `${univOrigin}/posts/photographers/80587`,
  },
  {
    title: 'SMOOOSYは助けを求める方との最初のつながりを作る、広告の役割に近い',
    content: '案件に応募すると、連絡先やプロフィール、事務所のホームページなどを見てもらえる機会が生まれます。手数料を支払って最初の入口を作っているという意味では、広告の役割に近いのかもしれません。',
    image: 'calico',
    proName: 'CALICO LEGAL行政書士事務所',
    link: `${univOrigin}/posts/administrative-scrivener/80001`,
  },
  // {
  //   title: 'お客様にピンポイントに訴求できるところがいいところ',
  //   content: '来日する海外アーティストの手続き関連のような「やってみたいけどなかなか巡り合えない案件」を受注することができました。SMOOOSYを使わなければ出会えなかった案件で、とても感謝しています。',
  //   image: 'caraiu',
  //   proName: 'カーライル行政書士事務所／藤井惠子 ',
  //   link: '/pro/administrative-scrivener/media/23166',
  // },
  {
    title: '自己PRや交渉次第で仕事を生み出せる。顧客と直接とつながれるのが面白い',
    content: 'いろいろなパターンの写真を多数撮ってきていますが、その中から何を選んでアピールするのか。いかにご依頼者の要望に合うような写真をお見せすることができるかが、受注のポイントだと感じています。',
    image: 'nagayama',
    proName: '永山昌克',
    link: `${univOrigin}/posts/photographers/79507`,
  },
  {
    title: 'Webマーケティングの知識のない状態から、多くの予約をもらうように',
    content: 'マッチングサイト等はほとんど知識がありませんでしたが、評価が見えるようになってきたからか成約率があがってきました。春にむけて、多くのご予約をSMOOOSYを介して頂戴しております。',
    image: 'cheri',
    proName: 'Cheriシェリ',
    link: `${univOrigin}/posts/dressing-up/79526`,
  },
]

export const Feedback = withStyles((theme) => ({
  container: {
    background: '#F9FCF4',
    padding: '96px 0 250px 0',
  },
  titleContainer: {
    position: 'relative',
    textAlign: 'center',
    margin: '0 auto 56px',
    width: 156,
  },
  registerNumContainer: {
    position: 'absolute',
    top: '-40px',
    left: 200,
    zIndex: '1',
    padding: '76px 45px 28px',
    background: '#EEF6DF',
    backgroundSize: '36px 29px',
    backgroundImage: `url('${imageOrigin}/static/protop/top-pro.png')`,
    backgroundPosition: 'top 27px center',
    backgroundRepeat: 'no-repeat',
  },
  triangle: {
    position: 'absolute',
    top: '148px',
    right: 27,
    height: 26,
  },
  greenTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '26px 20px 0 0',
    borderColor: '#EEF6DF transparent transparent transparent',
  },
  whiteTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '26px 5px 0 0',
    borderColor: `${theme.palette.common.white} transparent transparent transparent`,
    position: 'absolute',
    top: 0,
    zIndex: '1',
  },
  registerTitle: {
    textAlign: 'center',
    width: 100,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: '100%',
  },
  registerNum: {
    width: 100,
    textAlign: 'center',
    fontSize: 26,
    color: '#448F43',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    lineHeight: '30px',
    textAlign: 'center',
    marginBottom: 13,
  },
  feedbackContainer: {
    position: 'relative',
  },
}))(({classes}) => {

  const settings = {
    arrows: true,
    dots: true,
    infinite: false,
    variableWidth: true,
    centerMode: true,
    focusOnSelect: true,
    initialSlide: 0,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerPadding: 0,
  }

  const sliderStyle =`
.slick-dots {
  bottom: -48px;
} 
.slick-dots li button:before {
  font-size: 8px; 
  content: "■";
} 
.slick-dots li.slick-active button:before {
  color: #8CC11F;
} 
.slick-prev:before, .slick-next:before { 
  font-weight: bold; 
  opacity: 1;
} 
.slick-prev, .slick-next {
  z-index: 1; 
  width: 48px; 
  height: 48px; 
  background: #8CC11F; 
  color: #FFFFFF;
} 
.slick-next {
  top: 220px; 
  left: calc(50% + 368px);
} 
.slick-prev {
  top: 220px; 
  left: calc(50% - 428px);
} 
.slick-prev:before {
  content: "<"; 
  display: block; 
  margin-top: -4px;
} 
.slick-next:before { 
  content: ">"; 
  display: block; 
  margin-top: -4px
} 
.slick-next:focus, 
.slick-prev:focus {
  background: #8CC11F; 
  color: #FFFFFF;
} 
.slick-next:hover, 
.slick-prev:hover {
  background: #95C533; 
  color: #FFFFFF;
}
.slick-prev.slick-disabled:before, 
.slick-next.slick-disabled:before {
  cursor: not-allowed;
} 
button.slick-arrow.slick-prev.slick-disabled, 
button.slick-arrow.slick-next.slick-disabled
{
  cursor: not-allowed;
}
`

  return (
    <div className={classes.container}>
      <div className={classes.titleContainer}>
        <div className={classes.registerNumContainer}>
          <div className={classes.triangle}>
            <div className={classes.greenTriangle} />
            <div className={classes.whiteTriangle} />
          </div>
          <p className={classes.registerTitle}>登録事業者数</p>
          <p className={classes.registerNum}>20,000</p>
        </div>
        <h2 className={classes.title}>事業者の声</h2>
      </div>
      <div className={classes.feedbackContainer}>
        <PagerPapers
          items={feedbackList}
          sliderStyle={sliderStyle}
          sliderSetting={settings}
          Component={FeedbackCard}
        />
      </div>
    </div>
  )
})

export const FeedbackMobile = withStyles({
  container: {
    background: '#F9FCF4',
    padding: '80px 0',
    marginBottom: 80,
  },
  titleContainer: {
    textAlign: 'center',
    margin: '0 auto 48px',
  },
  registerNumContainer: {
    position: 'relative',
    margin: '0 auto 45px',
    width: 239,
    height: 114,
    background: '#EEF6DF',
    backgroundImage: `url('${imageOrigin}/static/protop/top-pro.png');`,
    backgroundSize: '36px 29px',
    backgroundPosition: 'top 43px left 40px',
    backgroundRepeat: 'no-repeat',
  },
  triangle: {
    position: 'absolute',
    top: 114,
    right: 65,
    height: 26,
  },
  greenTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '26px 20px 0 0',
    borderColor: '#EEF6DF transparent transparent transparent',
  },
  whiteTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '26px 5px 0 0',
    borderColor: '#F9FCF4 transparent transparent transparent',
    position: 'absolute',
    top: 0,
    zIndex: '1',
  },
  registerTitle: {
    paddingTop: 33,
    marginLeft: 94,
    width: 100,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: '100%',
    textAlign: 'center',
  },
  registerNum: {
    marginLeft: 94,
    width: 100,
    textAlign: 'center',
    fontSize: 26,
    color: '#448F43',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    lineHeight: '30px',
    textAlign: 'center',
    marginBottom: '13px',
  },
  feedbackContainer: {
    position: 'relative',
  },
})(({classes}) => {

  const settings = {
    arrows: false,
    dots: true,
    infinite: false,
    variableWidth: true,
    centerMode: true,
    focusOnSelect: true,
    initialSlide: 0,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerPadding: 0,
  }

  return (
    <div className={classes.container}>
      <div className={classes.titleContainer}>
        <h2 className={classes.title}>事業者の声</h2>
      </div>
      <div className={classes.registerNumContainer}>
        <div className={classes.triangle}>
          <div className={classes.greenTriangle} />
          <div className={classes.whiteTriangle} />
        </div>
        <p className={classes.registerTitle}>登録事業者数</p>
        <p className={classes.registerNum}>20,000</p>
      </div>
      <div className={classes.feedbackContainer}>
        <PagerPapers
          items={feedbackList}
          sliderStyle={'.slick-dots{bottom: -30px;} .slick-dots li button:before{font-size: 8px; content: "■";} .slick-dots li.slick-active button:before{color: #8CC11F}'}
          sliderSetting={settings}
          Component={FeedbackCard}
        />
      </div>
    </div>
  )
})


const FeedbackCard = withStyles((theme) => ({
  container: {
    background: theme.palette.common.white,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    width: 796,
    height: 410,
    display: 'flex',
    margin: '0 13px 0 0',
    cursor: 'pointer',
    [theme.breakpoints.down('sm')]: {
      width: 300,
      height: 610,
      display: 'block',
      margin: '0 17px 10px 0',
    },
  },
  imageCover: {
    overflow: 'hidden',
  },
  image: {
    width: 348,
    height: 410,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      height: 223,
    },
    transform: 'scale(1)',
    transition: theme.transitions.create(
      ['transform'],
      { duration: theme.transitions.duration.complex }
    ),
    [theme.breakpoints.up('md')]: {
      '&:hover': {
        transform: 'scale(1.2)',
      },
    },
  },
  hara: {
    backgroundImage: `url('${imageOrigin}/static/protop/hara.jpg')`,
  },
  kubota: {
    backgroundImage: `url('${imageOrigin}/static/protop/kubota.jpg')`,
  },
  calico: {
    backgroundImage: `url('${imageOrigin}/static/protop/calico.jpg')`,
  },
  caraiu: {
    backgroundImage: `url('${imageOrigin}/static/protop/caraiu.jpg')`,
  },
  nagayama: {
    backgroundImage: `url('${imageOrigin}/static/protop/nagayama.jpg')`,
  },
  cheri: {
    backgroundImage: `url('${imageOrigin}/static/protop/cheri.jpg')`,
  },
  feedback: {
    margin: '0 auto',
    color: '#0D0D0D',
    position: 'relative',
    width: 352,
    padding: '128px 0 56px',
    [theme.breakpoints.down('sm')]: {
      width: 230,
      padding: '43px 0',
    },
    [theme.breakpoints.up('md')]: {
      '&:hover > h3': {
        color: theme.palette.lightGreen.G550,
      },
    },
  },
  backgroundImage: {
    top: 43,
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundImage: `url('${imageOrigin}/static/protop/comma.png')`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    [theme.breakpoints.down('sm')]: {
      top: -15,
    },
  },
  title: {
    lineHeight: '180%',
    fontWeight: 'bold',
    fontSize: 18,
    width: 352,
    height: 64,
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      height: 'auto',
    },
  },
  content: {
    lineHeight: '180%',
    fontSize: 14,
    margin: '16px 0 32px',
    [theme.breakpoints.down('sm')]: {
      margin: '8px 0 24px',
    },
  },
  proName: {
    fontSize: 14,
    lineHeight: '100%',
    color: theme.palette.grey.G650,
    width: 307,
    height: 14,
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      height: 'auto',
    },
  },
}))(({ item, classes}) => {
  const { title, content, proName, image, link} = item
  return (
    <div onClick={() => document.location.href = link} className={classes.container}>
      <div className={classes.imageCover}>
        <div className={[classes.image, classes[image]].join(' ')} />
      </div>
      <div className={classes.feedback}>
        <div className={classes.backgroundImage} />
        <h3 className={classes.title}>{title}</h3>
        <div className={classes.content}>
          {content}
        </div>
        <p className={classes.proName}>
          {proName}
        </p>
      </div>
    </div>
  )
})
