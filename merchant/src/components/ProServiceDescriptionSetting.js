import React from 'react'
import { Field, FormSection } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'
import { Button, Collapse } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

import renderTextArea from 'components/form/renderTextArea'
import renderTextInput from 'components/form/renderTextInput'
import renderCheckbox from 'components/form/renderCheckbox'

import {
  profileDescriptionValidator,
  profileAccomplishmentValidator,
  profileAdvantageValidator,
  hasNGWords, hasEmail, hasPhone, hasURL,
} from 'lib/validate'

// TODO: そのうちtoolsより設定できるようにする
const PRO_SERVICE_PLACEHOLDERS = {
  'wedding-photographers': {
    catchphrase: '実績〇〇組以上！一生の思い出となる結婚式。自然で素敵な笑顔を残します。',
    description: `私は〇〇カメラマンといい、結婚式場の専属カメラマンとして～～年の経験を積んでいます。様々な式場での撮影経験もあり、トラブルや突然の不備も迅速に対応いたします。
ありがたいことに、お客様の思いつかなかったベストショットや素晴らしい写真を送っていただけると評判の声を多数いただいております。
自然な笑顔や魅力的な表情を撮影し、お客様が満足して頂けるよう精一杯撮影し、一生の思い出に残る写真を残して見せます。
`,
  },
  'portrait-photographers': {
    catchphrase: '女性カメラマン在籍♪あなたの魅力を引き出します！',
    description: `人物撮影の経験が豊富で、プロフィール写真やポートレートの撮影の際の雰囲気作りには自信があります。
自然な表情から、信頼感あふれるビジネス写真まで、ご要望通りの雰囲気を最大限演出します。
用途に合わせた写真を撮るため、事前の入念な打ち合わせを行っており、依頼者様の満足のために全力で撮影を任せてもらっています！
`,
  },
  'housing-architecture-photographers': {
    catchphrase: '【写真歴20年以上！】雄大さのあふれる建築写真を撮影いたします！',
    description: `建築写真を中心に写真家として活動しており、建築デザインを理解した、建築本来の良さを引き出した写真を撮影させて頂いております。
超広角レンズや空撮機材など、建築写真に必要な機材をフル活用して、一生飾れる写真を残すべく日々尽力しています。
`,
  },
  'restaurant-photographers': {
    catchphrase: '【年中無休】料理写真ならうちにお任せ！ホームページ、インスタ映えする写真を☆',
    description: `料理写真で最も大切なライティングにこだわりぬいており、自然光を活用した、シズル感あふれる写真撮影を心掛けています。
お店のメニューやホームページに掲載する写真など用途に合わせて構図やライティングを練りこみ、必ずや依頼者様の満足につながる写真を仕上げて見せます。
`,
  },
  'senior-photographers': {
    catchphrase: '写真選びもサポートします。あなたの素敵な写真を残しませんか？',
    description: `人物撮影を中心に写真家として活動しており、笑顔から感動の涙、遺影写真など幅広い経験を積んでおります。
遺影写真撮影に当たっては、写真を見るだけで、いろいろな思いでがよみがえってくるような、自分らしさあふれる写真を残すため、事前の綿密な打ち合わせ、当日の雰囲気づくりまで徹底してこだわりぬきます。
必ずや満足のいく写真を撮影しますので、ぜひ私にお任せください
`,
  },
  'tax-return-accountant': {
    catchphrase: '領収書丸投げOK!確定申告の面倒な仕分け作業すべて引き受けます。',
    description: `こんにちは、××に拠点を置いている〇〇です。
税理士として〇〇年の実績があり確定申告の経験も豊富です。会計ソフトにも対応できますので、お使いのソフトを遠慮なくお申し付けください。
領収書丸投げでも、キチンと申告させて頂きますので、お気軽に確定申告のことをご相談頂ければと思います。
`,
  },
  'inheritance-tax-accountant': {
    catchphrase: '土地相続のエキスパート。最適な相続プランを提案します。',
    description: `こんにちは、××に拠点を置いている〇〇です。税理士の中でも専門性の高い相続案件ですが、年間○○件以上の申告を手掛けており、制度のことは熟知しております。
最適な相続プランを提案し、円満相続の実現のため尽力致しますのでぜひご依頼ください。
`,
  },
  'unwanted-item-pick-up': {
    catchphrase: '【プライバシー守ります！】安心・迅速・コスパ良し！不用品なんでも回収！',
    description: `分別していない…
冷蔵庫一個だけなんだけど…
近所にあまり知られたくない…
こんな悩みありませんか？是非一度ご相談ください！
秘密厳守！即対応！あなたの様々なニーズに答えます。
年〇〇件の実績あり。誠実な対応を心がけています！是非ご依頼ください。
`,
  },
  'possessions-sorting': {
    catchphrase: '《口コミ多数》実績ある我が社が遺品整理のお手伝いいたします。',
    description: `年中無休24時間対応しており、ご都合のつく時間をお伝えください。なかなか手がつかない遺品整理ですが、丁寧な供養をしつつ、迅速に対応させて頂きます。
ついつい暗くなりがちな作業ですが、明るく元気なスタッフ一同、遺品整理を次への新たな一歩と感じて頂けるように爽やかなサービスを提供致します。
`,
  },
  'moving': {
    catchphrase: '迅速対応！深夜早朝もOK！引っ越しの不用品回収もご相談ください！',
    description: `年中無休いつでも対応！お客様のあらゆるニーズに答えます。
保険もあり安心のサポート！
依頼件数年〇〇件！豊富な経験で初めての引っ越しも心配いりません！
お客様に親身に寄り添うサービスが好評です。是非お見積もりください。
`,
  },
}

@withStyles(theme => ({
  labelTitle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
  labels: {
    background: theme.palette.common.white,
    borderRadius: 6,
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: '0 15px',
    marginBottom: 20,
  },
}))
export default class ProServiceDescriptionSetting extends React.Component {

  state = {
    detailOpen: false,
  }

  placeholder = {}

  componentDidMount() {
    const { proService } = this.props

    const placeholder = PRO_SERVICE_PLACEHOLDERS[proService.service.key]
    this.placeholder = {
      catchphrase: (placeholder || {}).catchphrase || '【実績豊富】○○なサービスは××な実績を持つ私にお任せ',
      description: (placeholder || {}).description || `例）こんにちは、${proService.profile.name}と申します。
  ${proService.service.name}にて○○会社様や、☓☓様向けに様々な実績がございます。

  私の強みは
  ●（専門機器、資格）を持っていること。
  ●（特殊なこと、得意なこと）をできること
  ○○はもちろん、☓☓も対応可能です。
  `,
      accomplishment: `例）${proService.service.name}にて

  ●個人向け
  ○○様向けに☓☓を実施・施工しました。
  ●企業・団体
  ○○業者様向け☓☓を実施・施工しました。
  ●受賞
  ○○コンテストにて受賞しました。
  `,
      advantage: `例）${proService.service.name}の○○について精通しております。
  ○○ではその知識が活きるかと思いますのでお気軽にご相談ください。
  `,
    }
  }

  validateDescription = description => {
    const { proService } = this.props

    if (description) {
      if (description.length < 200) {
        return 'サービス別自己紹介は200文字以上です'
      }
      const error = profileDescriptionValidator({description})
      return error.description
    }

    // サービス別自己紹介は、過去に設定したことがない場合は、未入力もOK
    // 一度でも入力したことある場合はエラーにする
    if (proService.description) {
      return '設定済みのため削除はできません'
    }

    return undefined
  }

  validateCatchphrase = catchphrase => {
    const { proService } = this.props

    if (catchphrase && (catchphrase.length < 10 || catchphrase.length > 40)) {
      return 'キャッチコピーは10〜40文字以内です'
    } else if (hasNGWords(catchphrase)) {
      return 'NGワードが含まれています'
    } else if (hasEmail(catchphrase)) {
      return 'メールアドレスが含まれています'
    } else if (hasPhone(catchphrase)) {
      return '電話番号が含まれています'
    } else if (hasURL(catchphrase)) {
      return 'URLが含まれています'
    }

    // 一度でも入力したことある場合はエラーにする
    if (!catchphrase && proService.catchphrase) {
      return '設定済みのため削除はできません'
    }

    return undefined
  }

  validateAccomplishment = accomplishment => {
    const { proService } = this.props

    if (!accomplishment) {
      if (proService.accomplishment)
        return '設定済みのため削除はできません'
      return undefined
    }
    if (accomplishment.length < 100) {
      return '実績は100文字以上です'
    }
    const error =  profileAccomplishmentValidator({accomplishment})
    return error.accomplishment
  }

  validateAdvantage = advantage => {
    const { proService } = this.props

    if (!advantage) {
      if (proService.advantage)
        return '設定済みのため削除はできません'
      return undefined
    }
    if (advantage.length < 100) {
      return 'アピールポイントは100文字以上です'
    }
    const error = profileAdvantageValidator({advantage})
    return error.advantage
  }

  render() {
    const { bulkMode, hideDetail, labels, classes, className } = this.props
    const { detailOpen } = this.state

    const detail = (
      <>
        <Field
          name='accomplishment'
          label='実績 ※100文字以上'
          textareaStyle={{minHeight: 180}}
          component={renderTextArea}
          placeholder={this.placeholder.accomplishment}
          validate={this.validateAccomplishment}
          showCounter
        />
        <Field
          name='advantage'
          label='アピールポイント ※100文字以上'
          textareaStyle={{minHeight: 180}}
          component={renderTextArea}
          placeholder={this.placeholder.advantage}
          validate={this.validateAdvantage}
          showCounter
        />
      </>
    )

    return (
      <div className={className}>
        <Field
          name='description'
          label='自己紹介 ※200文字以上'
          textareaStyle={{minHeight: 180}}
          component={renderTextArea}
          placeholder={this.placeholder.description}
          validate={this.validateDescription}
          showCounter
        />
        {!bulkMode && <Field
          name='catchphrase'
          label='キャッチコピー ※10〜40文字'
          component={renderTextInput}
          placeholder={this.placeholder.catchphrase}
          validate={this.validateCatchphrase}
          showCounter
        />}
        {labels && labels.length ?
        <>
          <div className={classes.labelTitle}>特長</div>
          <FormSection name='labels' className={classes.labels}>
            {labels.map(l => (
              <Field key={l._id} name={l._id} label={l.text} component={renderCheckbox} />
            ))}
          </FormSection>
        </>
        : null
        }
        {bulkMode ? null : hideDetail ?
        <div>
          {!detailOpen &&
          <Button onClick={() => this.setState({detailOpen: !detailOpen})}>
            <AddIcon style={{width: 16, height: 16}} />
              実績・アピールポイントを入力する（任意）
            </Button>
          }
          <Collapse in={!!detailOpen} timeout='auto'>{detail}</Collapse>
        </div>
        :
        <div>
          {detail}
        </div>
        }
      </div>
    )
  }
}
