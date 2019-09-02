import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, formValueSelector, Field, FieldArray, SubmissionError } from 'redux-form'
import { withRouter } from 'react-router'
import { Avatar, Button, Chip, IconButton, MenuItem, Paper, Table, TableBody, TextField } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import { Stepper, Step, StepLabel, StepContent } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'
import AddIcon from '@material-ui/icons/Add'
import CloseIcon from '@material-ui/icons/Close'
import RightArrowIcon from '@material-ui/icons/TrendingFlat'
import WarningIcon from '@material-ui/icons/Warning'

import { open as openSnack } from 'tools/modules/snack'
import { update as updateService, remove as removeService, relatedMedia, copyQuery } from 'tools/modules/service'
import { loadAll as loadCategories } from 'tools/modules/category'
import CustomRow from 'components/CustomRow'
import ConfirmDialog from 'components/ConfirmDialog'
import Editor from 'components/Editor'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'
import SelectServiceChip from 'tools/components/SelectServiceChip'
import renderCheckbox from 'components/form/renderCheckbox'
import renderNumberInput from 'components/form/renderNumberInput'
import renderSelect from 'components/form/renderSelect'
import renderTextArea from 'components/form/renderTextArea'
import renderTextInput from 'components/form/renderTextInput'
import { imageSizes } from '@smooosy/config'

import { relativeTime } from 'lib/date'

function getBudgetBasedDistance(budget, distance, formula) {
  return distance + formula.multiplier * Math.max(0, budget - formula.minBudget)
}

@withRouter
@connect(
  state => ({
    services: state.service.allServices,
    categories: state.category.categories,
    admin: state.auth.admin,
  }),
  { updateService, loadCategories, copyQuery, openSnack }
)
@reduxForm({
  form: 'serviceBasicForm',
  validate: values => {
    const errors = {}
    if (!values.key) {
      errors.key = '必須項目です'
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    return errors
  },
})
export class ServiceBasicForm extends React.Component {
  state = {
    categoryName: '',
    deleteDialog: false,
    servicesGroupedByQuery: {},
  }

  componentDidMount() {
    this.props.loadCategories()
    if (this.props.isNew) return
  }

  isAdmin = () => this.props.admin > 9

  selectCategory = (categoryId) => {
    const { categories } = this.props
    const category = categories.find(c => c.id === categoryId)
    if (!category) return
    this.setState({categoryName: category.name})
  }

  openCopyDialog = () => {
    const servicesGroupedByQuery = {}
    for (let s of this.props.services) {
      for (let q of s.queries) {
        const id = q.id || q
        if (!servicesGroupedByQuery[id]) servicesGroupedByQuery[id] = []
        servicesGroupedByQuery[id].push(s.name)
      }
    }
    this.setState({
      copyDialog: true,
      servicesGroupedByQuery,
    })
  }

  copyQuery = () => {
    const { service } = this.props
    this.setState({copying: true})
    this.props.copyQuery(service._id).then(() => {
      this.props.openSnack('完了しました')
    }).catch(e => {
      console.log(e.message)
      this.props.openSnack(e.message)
    }).finally(() => {
      this.setState({copying: false, copyDialog: false})
    })
  }

  submit = values => {
    let data = {
      key: values.key,
      name: values.name,
      category: values.category,
      providerName: values.providerName,
      priority: values.priority,
      basePoint: values.basePoint,
      manualAveragePoint: values.manualAveragePoint,
      enabled: values.enabled,
      interview: values.interview,
      needMoreInfo: values.needMoreInfo,
      tags: values.tags,
      distance: values.distance,
      eliminateTime: values.eliminateTime,
      similarServices: values.similarServices.map(s => s.id).filter(id => id !== values.id),
      recommendServices: values.recommendServices.map(s => s.id).filter(id => id !== values.id),
      budgetBasedDistanceFormula: values.budgetBasedDistanceFormula,
    }

    if (!this.props.isNew) {
      data.id = values.id
    }

    return this.props.updateService({
      ...data,
    }).then((c) => {
      if (this.props.isNew) {
        this.props.history.push(`/services/${c.id}`)
      } else {
        this.props.openSnack('保存しました')
      }
    }).catch((e) => {
      this.props.openSnack('保存に失敗しました: ' + e.message)
      if (e.message === 'already exist') {
        const msg = 'サービスキーまたはサービス名はすでに存在します'
        throw new SubmissionError({key: msg, name: msg})
      }
    })
  }

  render() {
    const { isNew, service, services, categories, handleSubmit, submitting } = this.props
    const { deleteDialog, servicesGroupedByQuery } = this.state

    const styles = {
      numberInput: {
        width: 100,
      },
      chip: {
        margin: 5,
      },
    }

    return (
      <form>
        <Table style={{marginTop: 10}}>
          <TableBody>
            <CustomRow title='サービスキー'>
              {isNew ?
                <Field name='key' component={renderTextInput} type='text' />
              : <a href={`/services/${service.key}`} target='_blank' rel='noopener noreferrer'>{service.key}</a>}
            </CustomRow>
            <CustomRow title='サービス名'>
              {this.isAdmin() ?
                <Field name='name' component={renderTextInput} type='text' />
              : service.name}
            </CustomRow>
            <CustomRow title='公開'>
              {this.isAdmin() ?
                <Field name='enabled' component={renderCheckbox} />
              : service.enabled ? 'yes' : 'no'}
            </CustomRow>
            <CustomRow title='カテゴリ'>
              {this.isAdmin() ?
                <Field name='category' component={renderSelect} onFieldChange={this.selectCategory} style={{minWidth: 100, marginBottom: 10}}>
                {categories.map(c =>
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                )}
                </Field>
              : categories.filter(c => c.id === service.category).map(c => c.name)}
            </CustomRow>
            <CustomRow title='タグ'>
              {this.isAdmin() ?
                <FieldArray
                  name='tags'
                  component={TagChip}
                  categoryName={this.state.categoryName}
                />
              : service.tags.join(', ')
              }
            </CustomRow>
            <CustomRow title='プロの呼び方'>
              {this.isAdmin() ?
                <Field name='providerName' component={renderTextInput} type='text' />
              : service.providerName}
            </CustomRow>
            <CustomRow title='優先度'>
              {this.isAdmin() ?
                <Field name='priority' component={renderNumberInput} type='number' afterLabel='/ 100' inputStyle={styles.numberInput} />
              : <p>{service.priority} / 100</p>}
            </CustomRow>
            <CustomRow title='ベースポイント'>
              {this.isAdmin() ?
                <Field name='basePoint' component={renderNumberInput} type='number' afterLabel='pt' inputStyle={styles.numberInput} />
              : <p>{service.basePoint || 0}pt</p>}
            </CustomRow>
            <CustomRow title='想定ポイント数（手動・推定受け取り依頼数等に影響します）'>
              {this.isAdmin() ?
                <Field name='manualAveragePoint' component={renderNumberInput} type='number' afterLabel='pt' inputStyle={styles.numberInput} />
              : <p>{service.manualAveragePoint}pt</p>}
              <div>平均ポイント数（過去100件の依頼）：{service.averagePoint}pt</div>
            </CustomRow>
            <CustomRow title='聞き取り必要'>
              {this.isAdmin() ?
                <Field name='interview' component={renderCheckbox} />
              : service.interview ? 'yes' : 'no'}
            </CustomRow>
            <CustomRow title='Need More Info'>
              {this.isAdmin() ?
                <Field name='needMoreInfo' component={renderCheckbox} />
              : service.needMoreInfo ? 'yes' : 'no'}
            </CustomRow>
            <CustomRow title='足切り時間設定'>
              {this.isAdmin() ?
                <Field name='eliminateTime' component={renderNumberInput} type='number' afterLabel='秒未満' inputStyle={styles.numberInput} />
              : service.eliminateTime ? `${service.eliminateTime}秒未満` : 'なし'}
            </CustomRow>
            <CustomRow title='距離(m)'>
              {this.isAdmin() ?
                <Field name='distance' component={renderNumberInput} type='number' afterLabel='m' inputStyle={styles.numberInput} parse={v => isNaN(parseFloat(v)) ? null : parseFloat(v)} />
              : <p>{service.distance} m</p>}
            </CustomRow>
            {this.isAdmin() &&
            <CustomRow title='距離の計算式'>
              <Field name='budgetBasedDistanceFormula'
                component={BudgetBasedDistanceFormulaEditor}
                styles={styles}
                service={service}
              />
            </CustomRow>
            }
            <CustomRow title='類似サービス'>
              <FieldArray
                name='similarServices'
                component={SelectServiceChip}
                title='類似サービス選択'
                services={services.filter(s => s._id !== service._id)}
                style={styles.chip}
              />
            </CustomRow>
            <CustomRow title='おすすめサービス'>
              <FieldArray
                name='recommendServices'
                component={SelectServiceChip}
                title='おすすめサービス選択'
                services={services.filter(s => s._id !== service._id)}
                style={styles.chip}
              />
            </CustomRow>
          </TableBody>
        </Table>
        {this.isAdmin() &&
          <div style={{display: 'flex', alignItems: 'center', marginTop: 10}}>
            {!isNew &&
              <Button
                size='small'
                color='secondary'
                variant='outlined'
                onClick={() => this.setState({deleteDialog: true})}
              >
                <WarningIcon style={{width: 20, height: 20}} />
                サービス削除・統合
              </Button>
            }
            {process.env.TARGET_ENV === 'dev' &&
              <Button
                style={{marginLeft: 10}}
                size='small'
                color='secondary'
                variant='outlined'
                onClick={this.openCopyDialog}
              >
                <WarningIcon style={{width: 20, height: 20}} />
                質問項目反映
              </Button>
            }
            <Dialog
              open={!!this.state.copyDialog}
              onClose={() => this.setState({copyDialog: false})}
            >
              <DialogTitle>
                {service.name}の質問項目を本番に反映します
              </DialogTitle>
              <DialogContent>
                {service.queries.map(q =>
                  <div key={q._id}>
                    <div style={{display: 'flex'}}>
                      <h4>{q.text}({q.type})</h4>
                      <div style={{flex: 1}} />
                      <div>最終更新 {relativeTime(new Date(q.updatedAt))}</div>
                    </div>
                    {servicesGroupedByQuery[q._id] && servicesGroupedByQuery[q._id].length > 1 &&
                      <details style={{marginLeft: 20, color: red[500]}}>
                        <summary>共通する質問です</summary>
                        {servicesGroupedByQuery[q._id].map((service, i) =>
                          <div key={q._id + i}>・{service}</div>
                        )}
                      </details>
                    }
                  </div>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={this.copyQuery}
                  disabled={this.state.copying}
                >
                  <WarningIcon />
                  実行する
                </Button>
              </DialogActions>
            </Dialog>
            <div style={{flex: 1}} />
            <Button disabled={submitting} variant='contained' color='secondary' onClick={handleSubmit(this.submit)}>
              保存する
            </Button>
          </div>
        }
        {this.isAdmin() && <ServiceDeleteDialog open={deleteDialog} service={service} onClose={() => this.setState({deleteDialog: false})} />}
      </form>
    )
  }
}

@withStyles(theme => ({
  pageDescription: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  pickupMedia: {
    position: 'relative',
    margin: 5,
    width: 120,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {},
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    padding: 5,
  },
  addImage: {
    position: 'relative',
    width: 120,
    height: 120,
    maxWidth: 120,
    maxHeight: 120,
    margin: 4,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      width: '18vw',
      height: '18vw',
    },
  },
  dummyAddImage: {
    width: 120,
    maxWidth: 120,
    margin: '0 4px',
    [theme.breakpoints.down('xs')]: {
      width: '18vw',
    },
  },
  checkNumber: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    fontSize: 20,
    color: theme.palette.primary.main,
    border: `5px solid ${theme.palette.primary.main}`,
    background: 'rgba(0, 0, 0, .5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
}))
@connect(
  state => ({
    media: state.service.media,
    services: state.service.allServices,
  }),
  { updateService, relatedMedia, openSnack }
)
@reduxForm({
  form: 'serviceSeoForm',
})
export class ServiceSeoForm extends React.Component {
  state = {
    checked: [],
  }

  openPickupDialog = () => {
    this.props.relatedMedia(this.props.service.id)
      .then(() => this.setState({pickup: true}))
  }

  prependMedia = () => {
    const { id, pickupMedia } = this.props.service
    const values = {id, pickupMedia: [...this.state.checked, ...(pickupMedia || []).map(m => m.id)]}
    this.props.updateService(values).then(this.props.load)
    this.setState({pickup: false, checked: []})
  }

  removePickup = (i) => {
    const { id, pickupMedia } = this.props.service

    pickupMedia.splice(i, 1)
    this.props.updateService({id, pickupMedia: pickupMedia.map(m => m.id)}).then(this.props.load)
  }

  toggle = (media) => {
    const checked = [...this.state.checked]
    const index = checked.indexOf(media.id)
    if (index === -1) {
      checked.push(media.id)
    } else {
      checked.splice(index, 1)
    }
    this.setState({checked})
  }

  submit = values => {
    let data = {
      id: values.id,
      description: values.description,
      priceComment: values.priceComment,
      pageTitle: values.pageTitle,
      pageMetaDescription: values.pageMetaDescription,
      pageDescription: values.pageDescription,
      mediaListPageDescription: values.mediaListPageDescription,
      priceArticleId: values.priceArticleId,
      seoSetting: {relatedServices: values.seoSetting.relatedServices.map(s => s._id)},
    }

    return this.props.updateService({
      ...data,
    }).then(() => {
      this.props.openSnack('保存しました')
    }).catch((e) => {
      this.props.openSnack('保存に失敗しました: ' + e.message)
    })
  }


  render() {
    const { service, services, media, handleSubmit, submitting, classes } = this.props
    const { pickup, checked } = this.state

    const pickupMediaIds = service.pickupMedia.map(m => m.id)

    return (
      <form>
        <Table style={{marginTop: 10}}>
          <TableBody>
            <CustomRow title='サービス説明'>
              <Field name='description' component={renderTextInput} type='text' />
            </CustomRow>
            <CustomRow title='プライスコメント'>
              <Field name='priceComment' component={Editor} ready />
            </CustomRow>
            <CustomRow title='SPタイトル'>
              <Field name='pageTitle' component={renderTextInput} type='text' />
            </CustomRow>
            <CustomRow title='SP Meta Description'>
              <Field name='pageMetaDescription' component={renderTextArea} type='text' />
            </CustomRow>
            <CustomRow title='SP説明文'>
              <Field name='pageDescription' component={renderTextArea} type='text' />
            </CustomRow>
            <CustomRow title='SPピックアップ写真'>
              <div style={{display: 'flex', flexWrap: 'wrap'}}>
                <Paper className={classes.pickupMedia} style={{cursor: 'pointer'}} onClick={this.openPickupDialog}>
                  <Avatar><AddIcon /></Avatar>
                </Paper>
                {(service.pickupMedia || []).map((m, i) =>
                  <Paper key={m.id} className={classes.pickupMedia}>
                    <img src={m.url + imageSizes.c160} style={{width: '100%', height: '100%'}} />
                    <IconButton className={classes.closeButton} onClick={() => this.removePickup(i)}><CloseIcon style={{color: 'white'}} /></IconButton>
                  </Paper>
                )}
              </div>
            </CustomRow>
            <CustomRow title='プロへの質問'>
              <div style={{display: 'flex', flexDirection: 'column', flexWrap: 'wrap'}}>
              {
                service.proQuestions.map(pq =>
                  <Link key={pq.id} to={`/proQuestions/${pq.id}`}>{`${pq.text}(${pq.proAnswers.length}件回答、${pq.publishedProAnswerCount}件掲載)`}</Link>
                )
              }
              </div>
            </CustomRow>
            <CustomRow title='記事一覧ページの説明文'>
              <Field name='mediaListPageDescription' component={renderTextArea} type='text' />
            </CustomRow>
            <CustomRow title='価格ページの記事ID'>
              <Field name='priceArticleId' component={renderNumberInput} type='text' />
            </CustomRow>
            <CustomRow title='関連サービス'>
              <FieldArray
                name='seoSetting.relatedServices'
                component={SelectServiceChip}
                title='関連サービス選択'
                services={(services || []).filter(s => s._id !== service._id)}
                style={{margin: 5}}
              />
            </CustomRow>
          </TableBody>
        </Table>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button disabled={submitting} variant='contained' color='secondary' style={{marginTop: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
        <ConfirmDialog
          title='ピックアップ写真を追加'
          open={!!pickup}
          label='追加する'
          onSubmit={this.prependMedia}
          onClose={() => this.setState({pickup: false})}
        >
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            {media && media.map(m => {
              if (pickupMediaIds.indexOf(m.id) !== -1) return null
              const index = checked.indexOf(m.id)
              return (
                <Paper className={classes.addImage} onClick={() => this.toggle(m)} key={`add_${m.id}`}>
                  <img src={m.url + imageSizes.c320} style={{width: '100%', height: '100%'}} />
                  {index > -1 && <div className={classes.checkNumber}>{index + 1}</div>}
                </Paper>
              )
            })}
            {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} className={classes.dummyAddImage} />)}
          </div>
        </ConfirmDialog>
      </form>
    )
  }
}

@withRouter
@connect(state => ({
  services: state.service.allServices,
}), { removeService })
class ServiceDeleteDialog extends React.Component {
  state = {
    confirm: '',
    activeStep: 0,
    migrateTo: [],
  }

  onRemove = () => {
    const { confirm, migrateTo } = this.state
    const { service } = this.props
    if (service.name === confirm) {
      this.props.removeService(service.id, migrateTo.map(m => m.id))
        .then(() => {
          this.props.onClose()
          this.props.history.replace('/services')
        })
    }
  }

  render() {
    const { open, service, services, onClose } = this.props
    const { confirm, activeStep, migrateTo } = this.state
    if (!service) return null

    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>サービス削除・統合</DialogTitle>
        <div style={{fontSize: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center', padding: '0 30px'}}>{service.name}<RightArrowIcon />{migrateTo.map(m => m.name).join(', ')}</div>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation='vertical'>
            <Step>
              <StepLabel><Button onClick={() => this.setState({activeStep: 0})}>統合先サービス選択</Button></StepLabel>
              <StepContent>
                <ServiceSelectorDetail multiple services={services} onSelect={s => this.setState({migrateTo: s, activeStep: 1})} />
              </StepContent>
            </Step>
            <Step>
              <StepLabel>確認</StepLabel>
              <StepContent style={{display: 'flex', flexDirection: 'column'}}>
                <p style={{marginBottom: 10}}><span style={{fontWeight: 'bold'}}>{service.name}</span>を削除して、<span style={{fontWeight: 'bold'}}>{migrateTo.map(m => m.name).join(', ')}</span>に統合しようとしています。全てのプロのプロフィールからこのサービスが削除され、SMOOOSY上に一切表示されなくなります。</p>
                <p>確認のため<span style={{fontWeight: 'bold'}}>削除するサービス名</span>を入力してください</p>
                <TextField fullWidth style={{padding: '10px 30px'}} error onChange={e => this.setState({confirm: e.target.value})} />
                <Button fullWidth disabled={service.name !== confirm} onClick={this.onRemove} variant='outlined' color='secondary'>このサービスを削除して統合する</Button>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>
    )
  }
}

class TagChip extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
    }
  }

  addChip = () => {
    const { text } = this.state
    if (text.length) {
      this.props.fields.push(text)
      this.setState({text: ''})
    }
  }

  componentDidUpdate() {
    const { fields, categoryName } = this.props

    // first tag equals to category name, so update when category changed
    if (categoryName.length > 0) {
      if (fields.length > 0) {
        fields.shift()
        fields.unshift(categoryName)
      } else {
        fields.push(categoryName)
      }
    }
  }

  render() {
    const { fields, style } = this.props

    return (
      <div style={{display: 'flex', flexWrap: 'wrap', ...style}}>
        {fields.map((name, idx) => {
          return <div key={idx} style={{margin: 5}}>
            <Field
              name={name}
              component={({input}) => {
                if (idx === 0) {
                  return <Chip label={input.value}/>
                }
                return <Chip onDelete={() => fields.remove(idx)} label={input.value} />

              }}
              style={{width: 250}}
            />
          </div>
        })}
        <div>
          <TextField margin='dense' type='text' value={this.state.text} onChange={e => this.setState({text: e.target.value})}/>
          <Button style={{marginLeft: 5}} variant='outlined' size='small' onClick={this.addChip}>追加</Button>
        </div>
      </div>
    )
  }
}

const serviceFormSelector = formValueSelector('serviceBasicForm')

const BudgetBasedDistanceFormulaEditor= connect(
  state => ({
    defaultDistance: serviceFormSelector(state, 'distance'),
  })
)(({ styles, input: { value }, defaultDistance }) => {
  defaultDistance = defaultDistance || 50000

  return (
      <>
        <div>
          <Field name='budgetBasedDistanceFormula.isEnabled' component={renderCheckbox} label='有効' />
        </div>
        {value.isEnabled &&
        <>
          <div style={{display: 'flex', flexWrap: 'wrap'}}>
            <Field name='budgetBasedDistanceFormula.minBudget' component={renderNumberInput} type='number' beforeLabel='最小予算' inputStyle={styles.numberInput} parse={v => isNaN(parseFloat(v)) ? null : parseFloat(v)} />
            <Field name='budgetBasedDistanceFormula.multiplier' component={renderNumberInput} type='number' beforeLabel='乗数' inputStyle={styles.numberInput} parse={v => isNaN(parseFloat(v)) ? null : parseFloat(v)} />
          </div>
          {value.minBudget && value.multiplier &&
            <div style={{marginTop: 10}}>
              <div>
                Formula: {defaultDistance / 1000} km + {value.multiplier} x (budget - {value.minBudget})
              </div>
              <div>
                Budget: {value.minBudget}円 Distance: {getBudgetBasedDistance(value.minBudget, defaultDistance, value) / 1000} km
              </div>
              <div>
                Budget: {value.minBudget * 2}円 Distance: {getBudgetBasedDistance(parseInt(value.minBudget) * 2, defaultDistance, value) / 1000} km
              </div>
              <div>
                Budget: {value.minBudget * 5}円 Distance: {getBudgetBasedDistance(value.minBudget * 5, defaultDistance, value) / 1000} km
              </div>
            </div>
          }
        </>
      }
      </>
  )
})
