import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { Field } from 'redux-form'
import { Button, FormControlLabel, Radio } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import Warning from '@material-ui/icons/Warning'

import AgreementLinks from 'components/AgreementLinks'
import GoogleMapEdit from 'components/GoogleMapEdit'
import renderCheckbox from 'components/form/renderCheckbox'
import renderTextInput from 'components/form/renderTextInput'
import renderRadioGroup from 'components/form/renderRadioGroup'

@withWidth({withTheme: true})
export default class SignupAsProDirect extends React.Component {
  render() {
    const { authFailed, error, user, submitting, handleSubmit, width, theme } = this.props
    const { onMapChange } = this.props
    const { loc, address, myServices, selected, related } = this.props
    const { common, grey } = theme.palette
    const query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})

    if (!selected) return null

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
      },
      wrap: {
        width: '95%',
        maxWidth: 800,
        marginBottom: width === 'xs' ? 80 : 0,
      },
      progress: {
        width: '100%',
        margin: '40px 0 20px',
        height: 8,
        background: '#ddd',
      },
      box: {
        background: common.white,
        border: `1px solid ${grey[300]}`,
        padding: 10,
        marginBottom: 10,
      },
      text: {
        padding: '40px 0 20px',
        fontSize: width === 'xs' ? 18 : 20,
        fontWeight: 'bold',
      },
      label: {
        fontSize: 13,
        fontWeight: 'bold',
        color: grey[700],
      },
      errorText: {
        paddingLeft: 5,
        color: '#f44336',
        fontSize: 12,
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
    }

    const form =
      <form onSubmit={handleSubmit(this.props.onSubmit)}>
        <div style={styles.text}>事業者情報を入力しましょう</div>
        <Field name='profile.name' component={renderTextInput} label='事業者名（フリーランスの方は屋号もしくはご自身のお名前）（必須）' type='text' />
        <div>
          <div style={{display: 'flex', width: '100%'}}>
            <Field style={{flex: 1, marginRight: 5}} name='lastname' component={renderTextInput} label='姓（必須）' type='text' />
            <Field style={{flex: 1, marginLeft: 5}} name='firstname' component={renderTextInput} label='名' type='text' />
          </div>
          {authFailed ?
            <div>
              <Field name='phone' component={renderTextInput} label='電話番号' type='tel' />
              <Field name='email' component={renderTextInput} label='メールアドレス' type='email' normalize={s => s.trim()} />
              <Field name='password' component={renderTextInput} label='パスワード' type='password' />
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
              <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>メールアドレス</div>
              <div style={{margin: '5px 0 15px'}}>{user.email}</div>
              {user.phone ?
                <div>
                  <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>電話番号</div>
                  <div style={{margin: '5px 0 15px'}}>{user.phone}</div>
                </div>
                :
                <Field name='phone' component={renderTextInput} label='電話番号' type='tel' />
              }
            </div>
          }
        </div>
        <div style={styles.label}>サービス提供拠点の住所（必須）</div>
        <div style={styles.box}>
          <GoogleMapEdit loc={loc} address={address} onChange={onMapChange} />
          <Field
            name='profile.loc'
            component={({meta}) =>
              meta.touched && meta.error ? <div style={styles.errorText}><Warning style={styles.errorIcon}/>{meta.error}</div> : null
            }
          />
          <Field name='profile.visiting' component={renderCheckbox} label='顧客の指定する場所に出張可能'/>
          <Field name='profile.visited' component={renderCheckbox} label='顧客が自分の事業所に来訪可能'/>
        </div>
        <div style={styles.label}>提供できるサービス（必須）</div>
        <div style={styles.box}>
          <div style={{margin: '5px 0', fontSize: 13}}>サービスは多めに選択しましょう。あなたの選んだサービスに関する案件のみが届きます。</div>
          {query.requestId && <div style={{margin: '5px 0', fontWeight: 'bold'}}>今回の依頼</div>}
          {selected.map(s => <Field key={s.id} name={`profile.services[${s.id}]`} component={renderCheckbox} label={s.name} disabled={myServices.includes(s.id) || query.requestId} />)}
          <div style={{margin: '5px 0', fontWeight: 'bold'}}>関連するサービス</div>
          {related.length > 0 ? related.slice(0, 12).map(s => <Field key={s.id} name={`profile.services[${s.id}]`} disabled={myServices.includes(s.id)} component={renderCheckbox} label={s.name} />) : 'なし'}
        </div>
        {error && <div style={styles.errorText}><Warning style={styles.errorIcon}/>{error}</div>}
        <AgreementLinks label={query.requestId ? '応募画面に移動する' : '次へ'} />
        <div style={{display: 'flex', alignItems: 'center', padding: '24px 0'}}>
          <div style={{flex: 1}} />
          <Button
            variant='contained'
            style={{minWidth: 120}}
            disabled={submitting}
            type='submit'
            color='primary'
          >
            {query.requestId ? '応募画面に移動する' : '次へ'}
          </Button>
        </div>
      </form>


    return (
      <div style={styles.root}>
        <Helmet>
          <title>事業者情報を入力</title>
        </Helmet>
        <div style={styles.wrap} >
          {form}
        </div>
      </div>
    )
  }
}
