import React from 'react'
import { withStyles } from '@material-ui/core'
import { amber } from '@material-ui/core/colors'

let CampaignReviewTerm = ({classes}) => (
  <div className={classes.content}>
    <div className={classes.headerWrap}>
      <div className={classes.header}>
        <div className={classes.headerBefore} />
        <div className={classes.headerMain} >
          <div className={classes.headerTitle}>
            <div><span className={classes.headerEmphasis}>3</span>つのクチコミ質問に答えて</div>
            <div className={classes.headerGift}>Amazon ギフト券</div>
            <div>最大<span className={classes.headerEmphasis}>1,000</span>円分プレゼント！</div>
          </div>
        </div>
        <div className={classes.headerAfter}>
          <div className={classes.deadline}>
            <div><span className={classes.deadlineDate}>6/30</span>(日)</div>
            <div>まで</div>
          </div>
        </div>
      </div>
    </div>
    <div className={classes.campaignDetail}>
      <div className={classes.paragraph}><span className={classes.bold}>キャンペーン名：</span>３つのクチコミ質問に答えて Amazon ギフト券最大1,000円分プレゼントキャンペーン</div>
      <div className={classes.paragraph}><span className={classes.bold}>キャンペーン対象者：</span>SMOOOSYで成約後、専用クチコミフォームからクチコミされた方</div>
      <div className={classes.paragraph}>
        <span className={classes.bold}>キャンペーン対象カテゴリ：</span>
        <div>
          <div className={classes.li}>税理士・行政書士・社会保険労務士・弁理士：1,000円</div>
          <div className={classes.li}>その他カテゴリ：300円</div>
        </div>
      </div>
      <div className={classes.paragraph}>
        <span className={classes.bold}>キャンペーン期間：</span>2019年6月30日まで
        <div>
          <div className={classes.li}>※ クチコミ投稿は質問3つ、各100文字以上の合計300文字以上の投稿がキャンペーン適用対象となります。</div>
          <div className={classes.li}>※ クチコミ投稿はキャンペーン専用クチコミの投稿が適用対象となります。</div>
          <div className={classes.li}>※ 1契約につき1回限り有効です。クチコミ投稿が完了した時点でキャンペーン応募となります。</div>
          <div className={classes.li}>※ 投稿の内容によりクチコミが削除された場合は無効となります。</div>
          <div className={classes.li}>※ 不正とみなされるような行為があった場合は、本キャンペーンの対象となりません。</div>
        </div>
      </div>
      <div className={classes.request}>操作に関するご不明な点は<a target='_blank' rel='noopener noreferrer' href='https://help.smooosy.com/'>こちら</a>までお気軽にお問い合わせください。</div>
      <div className={classes.bold}>【Amazonギフト券について】</div>
      <div className={classes.paragraph}><span className={classes.bold}>ギフト券の送付方法：</span>クチコミを投稿した翌月末日までにSMOOOSYに登録されているメールアドレス宛へ16桁からなるAmazonギフト券のコードをお知らせいたします。</div>
      <div className={classes.paragraph}><span className={classes.bold}>ご利用方法：</span>ご利用には Amazon.co.jp のアカウントを作成していただく必要があります。詳しい使用方法は <a target='_blank' rel='noopener noreferrer' href='https://www.amazon.co.jp/gp/help/customer/display.html?ie=UTF8&nodeId=201937190'>Amazon.co.jp</a> にてご確認ください。</div>
      <div className={classes.cautions}>
        <div className={classes.caution}>注意事項：</div>
        <div>
          <div>Amazon.co.jp は、本キャンペーンのスポンサーではございません。</div>
          <div>Amazon、Amazon.co.jpおよびそのロゴは Amazon.com, Inc. またはその関連会社の商標です。</div>
          <div>本キャンペーンは【株式会社SMOOOSY】による提供です。</div>
          <div>本キャンペーンについてのお問い合わせはAmazonではお受けしていません。</div>
          <div>お問い合わせは<a target='_blank' rel='noopener noreferrer' href='https://help.smooosy.com/'>こちら</a>までお願いいたします。</div>
          <div>本プレゼントの権利を譲渡することはできません。</div>
          <div>お客様のご都合によりAmazonギフト券のコード通知メールが受信できない場合は無効とさせていただきます。</div>
        </div>
      </div>
    </div>
  </div>
)

CampaignReviewTerm = withStyles((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
  headerWrap: {
    width: '100%',
    marginBottom: 8,
  },
  header: {
    backgroundColor: amber[600],
    width: '100%',
    padding: '16px 0px',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  headerGift: {
    color: theme.palette.common.white,
    fontSize: 40,
    [theme.breakpoints.down('xs')]: {
      fontSize: 32,
    },
  },
  headerEmphasis: {
    fontSize: 40,
    [theme.breakpoints.down('xs')]: {
      fontSize: 32,
    },
  },
  headerBefore: {
    flex: 1,
  },
  headerAfter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  deadline: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
    width: 120,
    height: 120,
    backgroundColor: theme.palette.common.white,
    borderRadius: 60,
    marginTop: 10,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  deadlineDate: {
    fontSize: 24,
  },
  attention: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    color: theme.palette.red[700],
    border: `4px solid ${amber[600]}`,
    textAlign: 'center',
    alignItems: 'baseline',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    padding: 4,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  attentionEmphasis: {
    color: theme.palette.red[700],
    margin: '0px 4px',
    fontSize: 32,
    [theme.breakpoints.down('xs')]: {
      margin: 0,
      fontSize: 24,
    },
  },
  campaignDetail: {
    width: '100%',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  li: {
    marginLeft: 16,
  },
  paragraph: {
    marginBottom: 4,
  },
  request: {
    margin: '20px 0',
  },
  cautions: {
    display: 'flex',
    marginTop: 20,
  },
  caution: {
    fontWeight: 'bold',
    width: 100,
    [theme.breakpoints.down('xs')]: {
      width: 190,
    },
  },
  bold: {
    fontWeight: 'bold',
  },
}))(CampaignReviewTerm)

export default CampaignReviewTerm
