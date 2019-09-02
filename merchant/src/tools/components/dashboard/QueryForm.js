import React from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm } from 'redux-form'
import { MentionsInput, Mention } from 'react-mentions'
import { Button, IconButton, MenuItem, CircularProgress, Chip, Checkbox, Radio, RadioGroup, FormLabel, FormControl, FormControlLabel } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { grey, red } from '@material-ui/core/colors'
import AddIcon from '@material-ui/icons/Add'
import ClearIcon from '@material-ui/icons/Clear'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'

import ConfirmDialog from 'components/ConfirmDialog'
import Prompt from 'components/Prompt'
import ValueCounter from 'components/ValueCounter'
import ValueSelector from 'components/ValueSelector'
import PriceToPointGraph from 'tools/components/PriceToPointGraph'
import renderPricesToPoints from 'tools/components/form/renderPricesToPoints'
import LogisticalSlider from 'components/LogisticalSlider'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSelect from 'components/form/renderSelect'
import renderCheckbox from 'components/form/renderCheckbox'
import { calcPriceOptions, calcFromFormula, formulaReplacer, evalFormula } from 'lib/price'
import { imageSizes } from '@smooosy/config'

const ValueComponents = {
  counter: ValueCounter,
  selector: ValueSelector,
  slider: LogisticalSlider,
}

const renderTag = ({ input, meta, onDelete, ...custom }) => (
  <Chip onDelete={() => onDelete(input.value)} style={{margin: '0px 10px 10px 0px'}} {...custom} label={input.value} />
)

const renderTags = ({ fields, meta, onDelete, onAddTag, style, ...custom }) => (
  <div style={{display: 'flex', flexWrap: 'wrap', ...(style || {})}} {...custom}>
    { fields.map((name, idx) => <Field name={name} component={renderTag} key={`tag_${idx}`} onDelete={onDelete} />) }
    <Button style={{margin: '0px 10px 10px 0px'}} onClick={onAddTag}>
      <AddIcon style={{width: 16, height: 16}} />
      タグを追加する
    </Button>
  </div>
)

const renderSelectSkipSteps = ({ fields, meta, values, queries, canEdit, ...custom }) => (
  <div {...custom}>
    {
      fields.map((skipQueryId, idx) => (
        <div key={`skip_${idx}`} style={{position: 'relative', background: '#eee', padding: '20px 0px 10px'}}>
          {canEdit && <IconButton onClick={() => fields.remove(idx)} style={{position: 'absolute', top: 0, right: 0, zIndex: 1}}><ClearIcon /></IconButton>}
          <Field name={skipQueryId} label='回答時にスキップする質問' component={renderSelect} fullWidth={true} >
            {queries.map(q =>
              <MenuItem key={`${skipQueryId}_${q.id}`} value={q.id || ''}>{q.summary}</MenuItem>
            )}
          </Field>
        </div>
      ))
    }
    <div>
      <Button onClick={() => fields.push('')}>
        <AddIcon style={{width: 16, height: 16}} />
        スキップする質問を追加する
      </Button>
    </div>
  </div>
)

const renderOptions = ({ fields, meta, values, type, queries, onSelectImage, onRemoveImage, canEdit, ...custom }) => (
  <div {...custom}>
    {
      fields.map((option, idx) => {
        return (
          <div key={`option_${idx}`} style={{position: 'relative', background: '#eee', padding: '20px 10px 10px', margin: '10px 0px'}}>
            {canEdit && <IconButton onClick={() => fields.remove(idx)} style={{position: 'absolute', top: 0, right: 0, zIndex: 1}}><ClearIcon /></IconButton>}
            <Field name={`${option}.text`} label='選択肢テキスト' component={renderTextInput} />
            {type === 'singular' || type === 'multiple' ?
              <>
                {queries.length > 0 && <FieldArray name={`${option}.skipQueryIds`} component={renderSelectSkipSteps} values={values.skipQueryIds} queries={queries} canEdit={canEdit} />}
                <Field name={`${option}.note`} label='自由記入欄（オプション）' component={renderSelect} fullWidth={true} style={{marginBottom: 16}}>
                  <MenuItem value=''>なし</MenuItem>
                  <MenuItem value='text'>テキストボックス（1行）</MenuItem>
                  <MenuItem value='textarea'>テキストエリア（複数行）</MenuItem>
                </Field>
                {values[idx].note &&
                  <Field name={`${option}.notePlaceholder`} label='記入欄placeholder' component={renderTextInput} />
                }
                {values[idx].image && (
                  <div style={{position: 'relative', width: 160, height: 160, background: '#ddd'}}>
                    <div style={{width: '100%', height: '100%', background: `url(${values[idx].image}${imageSizes.c80}) center/cover`}}/>
                    {canEdit && <IconButton style={{position: 'absolute', top: 0, right: 0, zIndex: 1}} onClick={event => onRemoveImage(event, idx)}><ClearIcon /></IconButton>}
                  </div>
                )}
                <input style={{marginBottom: 10}} type='file' accept='image/jpeg' onChange={event => onSelectImage(event, idx)} />
                {/* TODO: そのうち消す */}
                <div style={{display: 'flex'}}>
                  <Field name={`${option}.point`} label='ポイント追加（廃止予定）' component={renderTextInput} type='number' min={0} style={{flex: 1}} />
                  <Field name={`${option}.pointMultiplier`} label='ポイント掛算' component={renderTextInput} type='number' style={{flex: 1}} />
                  <Field name={`${option}.price`} label='予算変化' component={renderTextInput} type='number' step='any' min={0} style={{flex: 1}} />
                </div>
              </>
            : type === 'number' ?
              <>
                <Field name={`${option}.type`} label='数値選択種別' component={renderSelect} fullWidth={true} style={{marginBottom: 16}}>
                  <MenuItem value='counter'>カウンター</MenuItem>
                  <MenuItem value='selector'>セレクター</MenuItem>
                  <MenuItem value='slider'>対数スライダー</MenuItem>
                </Field>
                <div style={{display: 'flex'}}>
                  <Field name={`${option}.min`} label='最小値' component={renderTextInput} parse={v => parseInt(v)} type='number' />
                  <div style={{width: 20}} />
                  <Field name={`${option}.max`} label='最大値' component={renderTextInput} parse={v => parseInt(v)} type='number' />

                  {/* Range selector's default value is always the first option,
                      so disable the choose default value */}
                  <div style={{width: 20}} />
                  <Field disabled={values[idx].stepSize} name={`${option}.defaultNumber`} label='初期値' component={renderTextInput} type='number' />

                  <div style={{width: 20}} />
                  <Field name={`${option}.unit`} label='単位' component={renderTextInput} />
                  <div style={{width: 20}} />
                  <Field name={`${option}.price`} label='予算' component={renderTextInput} />
                  {values[idx].type === 'selector' &&
                    <>
                      <div style={{width: 20}} />
                      <Field name={`${option}.stepSize`} label='間隔' component={renderTextInput} />
                    </>
                  }
                </div>
              </>
            : null
            }
            <div style={{display: 'flex'}}>
              <Field name={`${option}.canWorkRemotely`} label='リモート OK' component={renderCheckbox} style={{flex: 1}} />
              <Field name={`${option}.usedForPro`} label='プロの仕事条件・予算に利用する' component={renderCheckbox} style={{flex: 1}} />
              <Field name={`${option}.removeTravelFee`} label='交通費が0になる' component={renderCheckbox} style={{flex: 1}} />
            </div>
            <div style={{display: 'flex'}}>
              <Button disabled={idx === fields.length - 1} onClick={() => fields.move(idx, idx + 1)}><ArrowDownwardIcon /></Button>
              <Button disabled={idx === 0} onClick={() => fields.move(idx, idx - 1)}><ArrowUpwardIcon /></Button>
            </div>
          </div>
        )
      })
    }
    <div>
      <Button onClick={() => fields.push({})}>
        <AddIcon style={{width: 16, height: 16}} />
        項目を追加する
      </Button>
    </div>
  </div>
)

const renderSubType = ({ input, meta, label, children, ...custom }) => (
  <FormControl {...custom}>
    {label && <FormLabel>{label}</FormLabel>}
    <RadioGroup {...input} row>
      {children}
    </RadioGroup>
  </FormControl>
)

class FormulaTextArea extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = { value: props.input.value }
  }
  onChange = (e, value) => {
    this.setState({value})
    this.props.input.onChange(value)
  }

  render() {
    const { suggest, label, meta: { error } } = this.props
    const { value } = this.state

    const styles = {
      input: {
        '&multiLine': {
          input: {
            width: '100%',
            height: 80,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: error ? red[500] : grey[300],
            borderRadius: 6,
            outline: 0,
            padding: 10,
            fontSize: 14,
            resize: 'vertical',
          },
        },
        suggestions: {
          list: {
            backgroundColor: 'white',
            border: `1px solid ${grey[300]}`,
            fontSize: 10,
          },
          item: {
            padding: '5px 15px',
            borderBottom: `1px solid ${grey[300]}`,
            '&focused': {
              backgroundColor: grey[100],
            },
          },
        },
      },
      mention: {
        background: grey[300],
        padding: '2px 0',
        borderRadius: 4,
      },
      error: {
        color: red[500],
        fontSize: 13,
        fontWeight: 'bold',
      },
    }

    return (
      <div>
        <div style={{fontSize: 13, fontWeight: 'bold', color: error ? red[500] : grey[700]}}>
          {label}
        </div>
        <MentionsInput
          style={styles.input}
          value={value}
          onChange={this.onChange}
        >
          <Mention
            appendSpaceOnAdd
            trigger='@'
            data={suggest}
            markup='{{__id__:__display__}}'
            displayTransform={(id, display) => `@${display}`}
            style={styles.mention}
          />
        </MentionsInput>
        {error && <div style={styles.error}>{error}</div>}
        <div style={{color: grey[800], fontSize: 13, marginBottom: 10}}>
          decay1(入力値, min, max, max時の係数), decay2(...) が使えます
        </div>
      </div>
    )
  }
}


const validateNumberOption = option => {
  const errors = {}
  if (!option.type) {
    errors.type = '必須項目です'
  }
  if (option.min === '' || option.min === undefined) {
    errors.min = '必須項目です'
  }
  if (option.max === '' || option.max === undefined) {
    errors.max = '必須項目です'
  }
  if (option.defaultNumber === '' || option.defaultNumber === undefined) {
    errors.defaultNumber = '必須項目です'
  }
  if (option.type === 'slider') {
    if (parseFloat(option.min) <= 0) {
      errors.min = '0以下は指定できません'
    }
    if (parseFloat(option.max) <= 0) {
      errors.max = '0以下は指定できません'
    }
    if (parseFloat(option.defaultNumber) <= 0) {
      errors.defaultNumber = '0以下は指定できません'
    }
  }
  if (parseFloat(option.min) > parseFloat(option.max)) {
    errors.min = '最小値が最大値を超えています'
  } else if (parseFloat(option.min) > parseFloat(option.defaultNumber) || parseFloat(option.max) < parseFloat(option.defaultNumber)) {
    errors.defaultNumber = '初期値が最小最大の範囲外です'
  }

  return errors
}

@reduxForm({
  form: 'query',
  enableReinitialize: true,
  initialValues: {},
  validate: values => {
    const errors = {}
    if (values.formula) {
      try {
        evalFormula(formulaReplacer({formula: values.formula}))
      } catch (e) {
        errors.formula = '不適切な数式です'
      }
    }
    if (values.usedForPro) {
      if (values.type === 'calendar') {
        if (!['duration', 'fixed'].includes(values.subType)) errors._error = '単一選択のみマッチ条件に設定できます'
      } else {
        if (!values.proText) errors.proText = '必須項目です'
        if (!(values.options || []).find(o => o.usedForPro)) errors._error = '「プロが選択可能」が1つもありません'
      }
    }
    if (values.type === 'number') {
      if (!values.options) {
        errors._error = '１つ以上項目が必要です'
      } else {
        errors.options = values.options.map(validateNumberOption)
      }
    }
    if (values.type === 'multiple' && values.priceFactorType === 'base' && values.options.length > 4) {
      errors._error = `複数選択の組み合わせが多すぎます(${Math.pow(2, values.options.length) - 1}通り)`
    }
    return errors
  },
})
@connect(
  state => ({
    canEdit: state.auth.admin >= 9,
    values: state.form.query.values || {},
  })
)
@withTheme
export default class QueryForm extends React.Component {
  constructor(props) {
    super(props)
    const formulaSuggest = []
    const replacement = {}
    if (props.focusService) {
      for (let q of props.focusService.queries) {
        if (q.type === 'singular') {
          formulaSuggest.push({
            id: q.id,
            display: q.summary,
          })
          replacement[q.id] = q.options[0] ? q.options[0].price : 0
        } else if (['multiple', 'number'].includes(q.type)) {
          for (let o of q.options) {
            formulaSuggest.push({
              id: o.id,
              display: `${q.summary}:${o.text}`,
            })
            replacement[o.id] = o.price || o.defaultNumber || 0
          }
        }
        if (q.id === props.values.id) break
      }
    }
    this.state = {
      formulaSuggest,
      replacement,
    }
  }

  handleRequestDeleteTag = (tag) => {
    this.props.change('tags', this.props.values.tags.filter(e => e !== tag))
  }

  handleAddTag = (tag) => {
    tag && this.props.change('tags', [...(this.props.values.tags || []), ...tag.split(/[,\s]+/)])
    this.setState({tagFormOpen: false})
  }

  handleSelectImage = (event, idx) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      this.props.change(`options[${idx}].image`, reader.result)
      this.props.change(`options[${idx}].file`, file)
    })
    reader.readAsDataURL(file)
  }

  handleRemoveImage = (event, idx) => {
    this.props.change(`options[${idx}].image`, null)
    this.props.change(`options[${idx}].file`, null)
  }

  handlePublished = (e) => {
    this.props.change('isPublished', e.target.checked)
  }

  changeReplace = (id, value) => {
    if (!id) return
    const { replacement } = this.state
    replacement[id] = value
    this.setState({replacement})
  }

  submit = values => {
    const submitValues = {...values}
    // usedForPro can be true only if singular/multiple/number/calendar
    if (!['singular', 'multiple', 'number', 'calendar'].includes(values.type)) {
      submitValues.usedForPro = false
    }
    this.props.onSubmit(submitValues)
  }

  render() {
    const { handleSubmit, submitting, values, services, index, focusService, error, canEdit } = this.props

    const queries = focusService ? focusService.queries.filter((q, idx) => idx > index) : []

    return (
      <form onSubmit={handleSubmit(this.submit)} style={{display: 'flex', flexDirection: 'column', height: '80vh'}}>
        <div style={{flex: 1, overflowX: 'hidden', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16}}>
          <Field autoFocus={true} name='text' label='質問文' component={renderTextInput} />
          <Field name='helperText' label='補助テキスト' component={renderTextArea} />
          <Field name='summary' label='質問文要約' component={renderTextInput} />
          {['singular', 'multiple', 'number'].includes(values.type) &&
            <div style={{background: grey[200], padding: 10}}>
              <Field name='usedForPro' label='プロがマッチ条件に利用' component={renderCheckbox} />
              {values.usedForPro &&
                <Field name='noOptionsChosenOkForPro' label='仕事条件で全て未選択も許容する' component={renderCheckbox} />
              }
              <Field name='priceFactorType' label='料金設定のタイプ' component={renderSelect} fullWidth>
                <MenuItem value=''>利用しない</MenuItem>
                <MenuItem value='base'>基本料金</MenuItem>
                <MenuItem value='discount'>割引</MenuItem>
                <MenuItem value='addon'>追加料金</MenuItem>
              </Field>
              {(values.usedForPro || values.priceFactorType) &&
                <>
                  <Field name='proText' label='プロ向け質問文' component={renderTextInput} />
                  <Field name='proHelperText' label='プロ向け補助テキスト(仕事条件向け)' component={renderTextInput} />
                  <Field name='proPriceHelperText' label='プロ向け補助テキスト(価格設定向け)' component={renderTextInput} />
                </>
              }
            </div>
          }
          {values.type === 'calendar' &&
            <div style={{background: grey[200], padding: 10}}>
              <Field name='usedForPro' label='プロがマッチ条件に利用' component={renderCheckbox} />
            </div>
          }
          <Field name='type' label='タイプ' component={renderSelect} fullWidth={true}>
            <MenuItem value='singular'>単一選択</MenuItem>
            <MenuItem value='multiple'>複数選択</MenuItem>
            <MenuItem value='number'>数値入力</MenuItem>
            <MenuItem value='price'>予算選択</MenuItem>
            <MenuItem value='calendar'>日付指定</MenuItem>
            <MenuItem value='location'>ロケーション指定</MenuItem>
            <MenuItem value='textarea'>自由記入欄</MenuItem>
            <MenuItem value='image'>画像添付</MenuItem>
          </Field>
          {['textarea', 'image', 'location', 'number'].includes(values.type) ?
            <Field name='subType' component={renderSubType}>
              <FormControlLabel value='none' control={<Radio color='primary' />} label='任意入力' />
              <FormControlLabel value='required' control={<Radio color='primary' />} label='必須入力' />
            </Field>
          : values.type === 'calendar' ?
            <Field name='subType' component={renderSubType}>
              <FormControlLabel value='duration' control={<Radio color='primary' />} label='単一選択（何時から何時間）' />
              <FormControlLabel value='fixed' control={<Radio color='primary' />} label='単一選択（時刻指定）' />
              <FormControlLabel value='multiple' control={<Radio color='primary' />} label='複数選択' />
              <FormControlLabel value='none' control={<Radio color='primary' />} label='カレンダーのみ' />
            </Field>
          : values.type === 'price' ?
            <Field name='subType' component={renderSubType}>
              <FormControlLabel value='none' control={<Radio color='primary' />} label='上限下限で設定' />
              <FormControlLabel value='formula' control={<Radio color='primary' />} label='数式で設定' />
            </Field>
          : null}
          {values.type === 'textarea' && <Field name='placeholder' label='プレースホルダ' component={renderTextArea} />}
          <div style={{height: 'auto', padding: '10px 0px'}}>
            <FieldArray
              name='tags'
              component={renderTags}
              onDelete={this.handleRequestDeleteTag}
              style={{display: 'flex', alignItems: 'center'}}
              onAddTag={() => this.setState({tagFormOpen: true})}
            />
          </div>
          {values.type === 'singular' &&
            <div>
              <FieldArray name='options' type={values.type} component={renderOptions} values={values.options} queries={queries} onSelectImage={this.handleSelectImage} onRemoveImage={this.handleRemoveImage} canEdit={canEdit} />
            </div>
          }
          {values.type === 'multiple' &&
            <div>
              <FieldArray name='options' type={values.type} component={renderOptions} values={values.options} queries={queries} onSelectImage={this.handleSelectImage} onRemoveImage={this.handleRemoveImage} canEdit={canEdit} />
            </div>
          }
          {values.type === 'number' &&
            <>
              <FieldArray name='options' type='number' component={renderOptions} values={values.options} canEdit={canEdit} />
              <Field name='usePriceToPoint' label={'予算からポイント計算'} component={renderCheckbox} />
              {values.usePriceToPoint &&
                <>
                  <FieldArray name='priceToPoints.mapping' component={renderPricesToPoints} />
                  {values.priceToPoints && values.priceToPoints.mapping.length > 1 && <PriceToPointGraph width={500} height={400} pricesToPoints={values.priceToPoints.mapping} /> }
                </>
              }
              <NumberCardPreview values={values} replacement={this.state.replacement} changeReplace={this.changeReplace} />
            </>
          }
          {values.type === 'price' && values.subType === 'formula' ?
            <div>
              <Field name='formula' label='数式' component={FormulaTextArea} suggest={this.state.formulaSuggest} />
              <div style={{display: 'flex'}}>
                <Field name='addPoint' label='ポイント+' component={renderTextInput} type='number' />
                <div style={{width: 20}} />
                <Field name='multiplePoint' label='ポイントx' component={renderTextInput} type='number' />
              </div>
              {calcFromFormula({...values, replacement: this.state.replacement, ignoreError: true}).map((option, i) =>
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <FormControlLabel disabled control={<Checkbox color='primary' />} label={option.text} />
                  {option.point > 0 && <b>+{option.point}pt</b>}
                </div>
              )}
            </div>
          : values.type === 'price' ?
            <div>
              <div style={{display: 'flex'}}>
                <Field name='minPrice' label='予算の下限' component={renderTextInput} type='number' />
                <div style={{width: 20}} />
                <Field name='maxPrice' label='予算の上限' component={renderTextInput} type='number' />
                <div style={{width: 20}} />
                <Field name='addPoint' label='ポイント+' component={renderTextInput} type='number' />
                <div style={{width: 20}} />
                <Field name='multiplePoint' label='ポイントx' component={renderTextInput} type='number' />
              </div>
              {values.minPrice && values.maxPrice &&
                calcPriceOptions(values).map((option, i) =>
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <FormControlLabel disabled control={<Checkbox color='primary' />} label={option.text} />
                  {option.point > 0 && <b>+{option.point}pt</b>}
                </div>
              )}
            </div>
          : null}
          {values.type === 'location' && values.subType !== 'required' &&
            <div>
              <Field name={'options[0].text'} label='場所を選ばない選択肢の文言' component={renderTextInput} style={{width: 250}}/>
              <Field name={'options[1].text'} label='場所を選ぶ選択肢の文言' component={renderTextInput} style={{width: 250}}/>
            </div>
          }
        </div>
        <div style={{padding: 10, display: 'flex', alignItems: 'center', boxShadow: '0px -2px 2px rgba(0, 0, 0, .2)', zIndex: 10}}>
          {canEdit && values.id && this.props.onRemove &&
            <Button color='secondary' onClick={() => this.setState({confirmOpen: true})}>
              この質問を削除する
            </Button>
          }
          {services && <div>{services.length}回利用</div>}
          <div style={{flex: 1}}/>
          {error && <div style={{color: red[500], fontWeight: 'bold', marginRight: 10}}>{error}</div>}
          {canEdit && <Button
            variant='contained'
            type='submit'
            disabled={submitting}
            color='primary'
          >
            {submitting ? <CircularProgress size={20} color='secondary' /> : values.id ? '更新する' : '作成する'}
          </Button>}
        </div>
        <ConfirmDialog
          title='本当に削除してよろしいですか？'
          open={!!this.state.confirmOpen}
          onSubmit={() => this.props.onRemove(values)}
          onClose={() => this.setState({confirmOpen: false})}
        >
          {services &&
            <div>
              <div style={{fontWeight: 'bold'}}>利用しているサービス</div>
              {services.map((s, i) => <div key={i}>{s}</div>)}
            </div>
          }
        </ConfirmDialog>
        <Prompt
          title='タグ入力'
          open={!!this.state.tagFormOpen}
          onClose={() => this.setState({tagFormOpen: null})}
          onSubmit={this.handleAddTag}
        />
      </form>
    )
  }
}

const NumberCardPreview = ({values, replacement, changeReplace}) => {
  const replaced = formulaReplacer({formula: values.formula, replacement})
  let price = 0
  try {
    price = evalFormula(replaced)
  } catch (e) {
    // empty
  }

  const styles ={
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: 6,
      paddingRight: 6,
      marginBottom: 20,
      width: '50%',
    },
  }

  return (
    <div style={{border: `1px solid ${grey[300]}`, background: grey[100], padding: 10, marginTop: 20}}>
      <h4>プレビュー</h4>
      <div style={{display: 'flex', flexWrap: 'wrap'}}>
        {(values.options || []).map((option, i) => {
          if (!option.type) return null
          const Component = ValueComponents[option.type]
          return (
            <div key={i} style={styles.wrapper}>
              {values.options.length > 1 && <div>{option.text}</div>}
              <Component
                defaultValue={option.defaultNumber}
                min={option.min}
                max={option.max}
                unit={option.unit}
                stepSize={option.stepSize}
                onChange={(value) => changeReplace(option.id, value)}
              />
            </div>
          )
        })}
      </div>
      <h4 style={{marginTop: 20}}>予算計算</h4>
      <div>{replaced} = {price}</div>
    </div>
  )
}
