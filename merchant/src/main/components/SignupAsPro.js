import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { Field, SubmissionError } from 'redux-form'
import { Button, FormControlLabel, Radio, LinearProgress } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import Warning from '@material-ui/icons/Warning'

import AgreementLinks from 'components/AgreementLinks'
import GoogleMapEdit from 'components/GoogleMapEdit'
import renderCheckbox from 'components/form/renderCheckbox'
import renderTextInput from 'components/form/renderTextInput'
import renderRadioGroup from 'components/form/renderRadioGroup'
import { payment } from '@smooosy/config'

@withWidth()
@withTheme
export default class SignupAsPro extends React.Component {

  handleServiceSubmit = (values) => {
    const emptyServices = !Object.values(values.profile.services).some(v => v)
    if (emptyServices) {
      throw new SubmissionError({
        _error: 'サービスを1つ以上選択してください',
      })
    }
    return this.props.handleNext()
  }

  render() {
    const { authFailed, user, error, submitting, width, theme } = this.props
    const { handleSubmit, handleNext, handlePrev, onMapChange } = this.props
    const { loc, address, initialLoc, myServices, selected, related } = this.props
    const { common, grey } = theme.palette
    const idx = parseInt(this.props.match.params.idx, 10) || 0
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    const relatedServices = related.slice(0, 12)
    if (!selected) return null

    const flows = [
      {
        'title': '1. お仕事紹介',
        'price': '無料',
        'image': '/images/pros/flow1.png',
        'description': 'あなたが登録した提供サービスや地域に応じて、ぴったりのお仕事がメールで届きます。',
        'notes': [],
      },
      {
        'title': '2. 応募',
        'price': `${payment.pricePerPoint.withTax}円〜`,
        'image': '/images/pros/flow2.png',
        'description': '応募時に料金が発生する仕組みです。届いたお仕事からあなたが応募したい案件を選び、お客様と直接やりとりしていただけます。',
        'notes': [
          '※案件によって応募手数料は異なります。',
          '※お客様が応募メッセージを開封しなかった場合、手数料は返還されます。',
        ],
      },
      {
        'title': '3. 成約',
        'price': '無料',
        'image': '/images/pros/flow3.png',
        'description': 'お客様は最大5名までのプロとのやり取りでプロを決定します。',
        'notes': [],
      },
    ]

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
      },
      base: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      },
      wrap: {
        flex: 1,
        overflowX: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      },
      content: {
        display: 'flex',
        flexDirection: 'column',
        margin: '20px auto',
        width: '90%',
        maxWidth: 800,
      },
      footer: {
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        width: '100%',
      },
      footerBar: {
        display: 'flex',
        flexDirection: 'row',
        padding: '10px 0px',
        margin: '0px auto',
        width: '90%',
        maxWidth: 800,
      },
      progress: {
        width: '100%',
        height: 8,
        background: '#ddd',
      },
      box: {
        background: common.white,
        border: `1px solid ${grey[300]}`,
        padding: '0 10px',
      },
      text: {
        padding: '20px 0',
        fontSize: width === 'xs' ? 16 : 18,
        fontWeight: 'bold',
      },
      errorText: {
        paddingLeft: 5,
        color: '#f44336',
        fontSize: 12,
        height: 20,
      },
      errorIcon: {
        verticalAlign: 'bottom',
        width: 18,
        height: 18,
        color: '#f44336',
      },
      questions: {
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        marginBottom: 10,
        border: `1px solid ${grey[300]}`,
        borderRadius: 5,
        background: common.white,
      },
      flows: {
        display: 'flex',
        flexDirection: width === 'xs' ? 'column' : 'row',
        background: common.white,
        border: `1px solid ${grey[300]}`,
        padding: width === 'xs' ? '10px' : '20px',
      },
    }

    // 新規登録フローのパーツが揃ったら使います
    const flowPage = ( // eslint-disable-line
      <div key='flow' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>SMOOOSYのしくみ</div>
            <div style={styles.flows}>
            {flows.map((f, i) =>
              <div key={`flow${i}`} style={{flex: 1, margin: '10px'}}>
                <div style={{fontSize: width === 'xs' ? 16 : 18, fontWeight: 'bold', padding: '5px', textAlign: width === 'xs' ? 'left' : 'center'}}>{f.title}</div>
                <img src={f.image} style={{width: '100%', padding: width === 'xs' ? '0px 50px' : '5px 30px', textAlign: 'center'}}/>
                <div style={{fontSize: 20, fontWeight: 'bold', padding: '5px', textAlign: 'center'}}>{f.price}</div>
                <div style={{fontSize: 13}}>{f.description}</div>
                {f.notes.map((note, j) => <div key={`note${i}-${j}`} style={{fontSize: 11, color: grey[700]}}>{note}</div>)}
              </div>
            )}
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <div style={{flex: 1}} />
            <Button
              className='flowPageSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              color='primary'
              type='button'
              onClick={handleNext}
            >
              次へ
            </Button>
          </div>
        </div>
      </div>
    )

    const serviceSelectPage = (
      <form key='service' style={styles.base} onSubmit={handleSubmit(this.handleServiceSubmit)}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>提供できるサービスを全て選択してください</div>
            <div style={{margin: '20px 0'}}>サービスは多めに選択しましょう。あなたの選んだサービスに関する案件のみが届きます。</div>
            <div style={styles.box}>
              {selected.map(s => <Field key={s.id} name={`profile.services[${s.id}]`} component={renderCheckbox} label={s.name} disabled={myServices.includes(s.id)} />)}
            </div>
            <div style={{margin: '20px 0 10px', fontWeight: 'bold'}}>関連するサービス
              {relatedServices.length > 0 && <Button style={{margin: '0px 20px'}} onClick={() => {
                relatedServices.filter(s => !myServices.includes(s.id)).forEach(s => this.props.change(`profile.services[${s.id}]`, true))
              }}>全て選択する</Button>}
            </div>
            <div style={styles.box}>
              {relatedServices.length ? relatedServices.map(s => <Field key={s.id} name={`profile.services[${s.id}]`} disabled={myServices.includes(s.id)} component={renderCheckbox} label={s.name} />) : 'なし'}
            </div>
            {error && <div style={{color: '#f00', fontSize: 13, paddingTop: 5}}>{error}</div>}
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <Button onClick={handlePrev}>
              <NavigationChevronLeft />
              戻る
            </Button>
            <div style={{flex: 1}} />
            <Button
              className='serviceSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={!!error || submitting}
              color='primary'
              type='submit'
            >
              次へ
            </Button>
          </div>
        </div>
      </form>
    )

    const locationSelectPage = (
      <form key='loc' style={styles.base} onSubmit={handleSubmit(this.props.onSubmit)}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>サービス提供拠点はどちらですか？</div>
            <GoogleMapEdit style={{padding: width === 'xs' ? 10 : 20, background: common.white, border: `1px solid ${grey[300]}`}} loc={loc} address={address} onChange={onMapChange} initial={initialLoc} />
            <Field
              name='profile.loc'
              component={({meta}) =>
                meta.touched && meta.error ? <div style={styles.errorText}><Warning style={styles.errorIcon}/>{meta.error}</div> : <div style={{marginBottom: 20}} />
              }
            />
            <div style={{background: common.white, border: `1px solid ${grey[300]}`, padding: width === 'xs' ? '0 10px' : '0 20px'}}>
              <Field name='profile.visiting' component={renderCheckbox} label='顧客の指定する場所に出張可能'/>
              <Field name='profile.visited' component={renderCheckbox} label='顧客が自分の事業所に来訪可能'/>
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <Button onClick={handlePrev}>
              <NavigationChevronLeft />
              戻る
            </Button>
            <div style={{flex: 1}} />
            <Button
              className='locationSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={!loc || submitting}
              color='primary'
              type='submit'
            >
              {query.requestId ? '応募画面に移動する' : '次へ'}
            </Button>
          </div>
        </div>
      </form>
    )

    const profileSignupPage = (
      <form key='profile' style={styles.base} onSubmit={handleSubmit(this.props.onSignup)}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>{`事業者名${authFailed ? '、メールアドレス、氏名' : ''}を入力してください。`}</div>
            <Field name='profile.name' classes={{input: 'profileNameInput'}} component={renderTextInput} label='事業者名（個人事業主・フリーランスの方は屋号もしくはご自身のお名前をご記入ください）' type='text' />
            {authFailed ?
              <div>
                <div style={{display: 'flex', width: '100%'}}>
                  <Field style={{flex: 1, marginRight: 5}} name='lastname' classes={{input: 'lastnameInput'}} component={renderTextInput} label='姓' type='text' />
                  <Field style={{flex: 1, marginLeft: 5}} name='firstname' classes={{input: 'firstnameInput'}} component={renderTextInput} label='名' type='text' />
                </div>
                <div style={{color: grey[700], fontSize: 12, margin: '0 0 5px 5px'}}>※姓名は依頼者には表示されません。</div>
                <Field name='phone' classes={{input: 'phoneInput'}} component={renderTextInput} label='電話番号' type='tel' />
                <Field name='email' classes={{input: 'emailInput'}} component={renderTextInput} label='メールアドレス' type='email' normalize={s => s.trim()} />
                <Field name='password' classes={{input: 'passwordInput'}} component={renderTextInput} label='パスワード' type='password' />
                <Field
                  name='questions'
                  component={renderRadioGroup}
                  label='SMOOOSYはどこで知りましたか？'
                  style={styles.questions}
                  hidden={!!query.refer || !!query.utm_medium}
                >
                  <FormControlLabel value='email' control={<Radio color='primary' />} label='弊社からのメール' />
                  <FormControlLabel value='refer' control={<Radio color='primary' />} label='知り合いからの紹介' />
                  <FormControlLabel value='tel' control={<Radio color='primary' />} label='お電話' />
                  <FormControlLabel value='flyer' control={<Radio color='primary' />} label='チラシ' />
                  <FormControlLabel value='postcard' control={<Radio color='primary' />} label='ハガキ' />
                  <FormControlLabel value='magazineAd' control={<Radio color='primary' />} label='雑誌広告' />
                  <FormControlLabel value='fax' control={<Radio color='primary' />} label='FAX' />
                  <FormControlLabel value='other' control={<Radio color='primary' />} label='その他' />
                </Field>
              </div>
              :
              <div>
                <div style={{display: 'flex', width: '100%'}}>
                  <div style={{marginRight: 10}}>
                    <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>姓</div>
                    <div style={{margin: '5px 0 0'}}>{user.lastname}</div>
                  </div>
                  <div>
                    <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>名</div>
                    <div style={{margin: '5px 0 0'}}>{user.firstname}</div>
                  </div>
                </div>
                <div style={{color: grey[700], fontSize: 12, margin: '0 0 15px'}}>※姓名は依頼者には表示されません。</div>
                <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>メールアドレス</div>
                <div style={{margin: '5px 0 15px'}}>{user.email}</div>
                {user.phone ?
                  <div>
                    <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>電話番号</div>
                    <div style={{margin: '5px 0 15px'}}>{user.phone}</div>
                  </div>
                  :
                  <Field name='phone' classes={{input: 'phoneInput'}} component={renderTextInput} label='電話番号' type='tel' />
                }
              </div>
            }
          </div>
        </div>
        <div style={{background: grey[100], padding: '5px'}}>
          <AgreementLinks label='次へ' />
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <div style={{flex: 1}} />
            <Button
              className='userSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              color='primary'
              type='submit'
            >
              次へ
            </Button>
          </div>
        </div>
      </form>
    )
    const steps = [
      profileSignupPage,
      flowPage,
      serviceSelectPage,
      locationSelectPage,
    ]

    const step = steps[idx]
    const progress = (idx + 1) / steps.length * 70

    return (
      <div style={styles.root}>
        <Helmet>
          <title>事業者情報を入力</title>
        </Helmet>
        <LinearProgress variant='determinate' value={progress} style={styles.progress} />
        {step}
      </div>
    )
  }
}
