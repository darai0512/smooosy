import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Table, TableBody, MenuItem, Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'

import { update } from 'tools/modules/meet'
import { open as openSnack } from 'modules/snack'
import CustomRow from 'components/CustomRow'
import renderTextInput from 'components/form/renderTextInput'
import renderSelect from 'components/form/renderSelect'
import Chats from 'components/Chats'
import Review from 'components/Review'
import PriceBreakdown from 'components/PriceBreakdown'
import { priceFormat } from 'lib/string'

@reduxForm()
@connect(
  () => ({}),
  { update, openSnack }
)
@withTheme
export default class MeetDetail extends React.Component {

  onSubmit = values => {
    const body = { id: values.id }
    for (let name of ['price', 'priceType', 'status']) {
      if (values[name] !== this.props.initialValues[name]) {
        body[name] = values[name]
      }
    }
    body.updatedAt = this.props.initialValues.updatedAt
    return this.props.update(body)
      .then(() => this.props.loadRequest(values.request._id))
      .catch(err => {
        const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
        this.props.openSnack(msg)
      })
  }

  render() {
    const { initialValues, theme, handleSubmit } = this.props
    const { grey } = theme.palette

    const meet = initialValues

    const styles = {
      title: {
        padding: 10,
        background: grey[100],
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }

    return (
      <div>
        <h4 style={styles.title}>情報編集</h4>
        <form style={{marginBottom: -1}} onSubmit={handleSubmit(this.onSubmit)}>
          <Table>
            <TableBody>
              <CustomRow title='ID'>{meet.id}</CustomRow>
              <CustomRow title='作成日時'>{new Date(meet.createdAt).toLocaleString()}</CustomRow>
              <CustomRow title='価格'>
                {priceFormat(meet)}
                <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                  <Field name='priceType' component={renderSelect}>
                    <MenuItem value='fixed'>固定価格</MenuItem>
                    <MenuItem value='hourly'>時給</MenuItem>
                    <MenuItem value='needMoreInfo'>追加情報が必要</MenuItem>
                    <MenuItem value='float'>概算価格</MenuItem>
                    <MenuItem value='minimum'>最低料金</MenuItem>
                  </Field>
                  <Field name='price' component={renderTextInput} />
                </div>
              </CustomRow>
              <CustomRow title='消費ポイント'>{meet.point || 0}pt</CustomRow>
              <CustomRow title='ステータス'>
                <Field name='status' component={renderSelect}>
                  <MenuItem value='waiting'>未成約</MenuItem>
                  <MenuItem value='progress'>成約</MenuItem>
                  <MenuItem value='done'>完了（クチコミ待ち）</MenuItem>
                  {meet.status === 'exclude' && <MenuItem value='exclude'>除外</MenuItem>}
                </Field>
                {meet.status === 'waiting' && meet.remindReason && <p>検討理由: {meet.remindReason}</p>}
                {meet.status === 'exclude' && meet.excludeReason && <p>除外理由: {meet.excludeReason}</p>}
              </CustomRow>
              {meet.hiredAt && <CustomRow title='成約日時'>{new Date(meet.hiredAt).toLocaleDateString()}</CustomRow>}
            </TableBody>
          </Table>
          <div style={{padding: 10, display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant='contained' color='secondary' type='submit'>更新する</Button>
          </div>
        </form>
        {meet.isCreatedByUser &&
          <>
            <h4 style={styles.title}>見積もり価格</h4>
            <div style={{padding: 10, borderBottom: `1px solid ${grey[300]}`}}>
              <PriceBreakdown price={meet.priceValues} />
            </div>
            <Table style={{marginBottom: -1}}>
              <TableBody>
                <CustomRow title='ラクラクお得モード'>{meet.proResponseStatus === 'autoAccept' ? 'ON' : 'OFF'}</CustomRow>
              </TableBody>
            </Table>
          </>
        }
        <h4 style={styles.title}>チャット</h4>
        <Chats chats={meet.chats} me={meet.customer} style={{padding: 20}} meet={meet} />
        <h4 style={styles.title}>クチコミ</h4>
        <div style={{margin: 20}}>
          {meet.review ? <Review review={meet.review} /> : 'クチコミはありません'}
        </div>
      </div>
    )
  }
}
