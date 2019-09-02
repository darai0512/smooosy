import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray, formValueSelector } from 'redux-form'
import { IconButton, Button, Menu, MenuItem, Dialog, CircularProgress, FormControlLabel, Radio } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import UpIcon from '@material-ui/icons/KeyboardArrowUp'
import DownIcon from '@material-ui/icons/KeyboardArrowDown'
import CloseIcon from '@material-ui/icons/Close'
import HomeIcon from '@material-ui/icons/Home'
import LeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import { Controlled as CodeMirror } from 'react-codemirror2'

import { withApiClient } from 'contexts/apiClient'
import renderTextInput from 'components/form/renderTextInput'
import renderRadioGroup from 'components/form/renderRadioGroup'
import { open as openSnack } from 'tools/modules/snack'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/theme/material.css'

const selector = formValueSelector('crawlTemplate')
const actionFields = {
  text: {
    label: '文字列取得',
    selector: true,
    name: true,
    match: true,
  },
  attr: {
    label: 'タグ属性取得',
    selector: true,
    attr: true,
    name: true,
    match: true,
  },
  click: {
    label: 'クリック',
    selector: true,
  },
  link: {
    label: 'リンク遷移',
    selector: true,
  },
  goback: {
    label: '前のページ',
  },
  goto: {
    label: 'ページ遷移',
    url: true,
  },
  wait: {
    label: '指定時間待つ',
    ms: true,
  },
  foreach: {
    label: '繰り返し',
    selector: true,
  },
  if: {
    label: '条件分岐',
    selector: true,
  },
  set: {
    label: '値セット',
    name: true,
    value: true,
  },
}

@withApiClient
@connect(
  state => ({
    baseUrl: selector(state, 'baseUrl'),
    actions: selector(state, 'actions') || [],
    source: selector(state, 'source'),
  }), { openSnack }
)
@reduxForm({
  form: 'crawlTemplate',
})
export default class CrawlBuilder extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      history: props.baseUrl ? [props.baseUrl] : [],
      count: 0,
    }
  }

  componentDidMount() {
    window.hoverDOM = ({selector, link, count, html}) => {
      this.setState({selector, link, html, count})
    }
    window.clickDOM = ({selector, link}) => {
      const { hoverField } = this.state
      if (hoverField) {
        this.props.change(hoverField, selector)
      }

      if (link) {
        const history = this.state.history.slice()
        history.push(link)
        this.setState({history})
      }
    }
  }

  setMode = ({selector, mode, field, currentPage}) => {
    setTimeout(() => {
      window.smooosyInjectForeach = currentPage ? selector : null
      window.smooosyInjectMode = mode
      this.setState({hoverField: field})
    }, 500)
  }

  goto = (link) => {
    const history = this.state.history.slice()
    history.push(link)
    this.setState({history})
  }

  goback = () => {
    if (this.state.history.length < 2) return
    const history = this.state.history.slice()
    history.pop()
    this.setState({history})
  }

  submit = values => {
    return this.props.update(values)
      .then(() => this.props.openSnack('保存しました'))
  }

  testExecute = () => {
    const { baseUrl, actions } = this.props
    this.setState({executeResult: 'progress'})
    this.props.apiClient.post('/api/admin/crawls/execute', {baseUrl, actions})
      .then(res => this.setState({executeResult: res.data}))
      .catch(err => this.setState({executeResult: err}))
  }

  render() {
    const { handleSubmit } = this.props
    const { history, executeResult, selector, html, link, count } = this.state

    const styles = {
      root: {
        height: '100%',
        width: '100%',
        display: 'flex',
      },
      left: {
        flex: 3,
        padding: 10,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      right: {
        flex: 2,
        padding: 10,
        borderLeft: `1px solid ${grey[300]}`,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      iframe: {
        width: '100%',
        height: 400,
      },
      buttons: {
        display: 'flex',
      },
      iconButton: {
        cursor: 'pointer',
        margin: 10,
      },
      dialog: {
        padding: 30,
      },
      progress: {
        width: '100%',
        padding: 30,
        textAlign: 'center',
      },
      code: {
        width: '100%',
        padding: 10,
        background: grey[100],
        whiteSpace: 'pre-wrap',
      },
    }

    const last = history[history.length - 1]

    return (
      <form style={styles.root} onSubmit={handleSubmit(this.submit)}>
        <div style={styles.left}>
          <Field label='名前' name='name' component={renderTextInput} />
          <Field label='ベースURL' name='baseUrl' component={renderTextInput} />
          <div style={styles.buttons}>
            <IconButton onClick={() => this.setState({history: [this.props.baseUrl]})}><HomeIcon /></IconButton>
            <IconButton onClick={() => this.goback()} disabled={history.length < 2}><LeftIcon /></IconButton>
          </div>
          <iframe
            ref={e => this.iframe = e}
            src={last ? `/api/crawls/inject?url=${last}` : 'about:blank'}
            sandbox='allow-same-origin allow-scripts'
            style={styles.iframe}
          />
          <div style={{background: grey[100], padding: 5}}>
            <p>{count}個</p>
            <p style={{fontSize: 10}}>{selector}</p>
            <p style={{fontSize: 10, maxHeight: 40, overflow: 'auto'}}>{html}</p>
            <a style={{fontSize: 10}} onClick={() => this.goto(link)}>{link}</a>
          </div>
          <div style={styles.buttons}>
            <Button type='submit' variant='contained' color='secondary'>保存する</Button>
            <Button variant='contained' color='primary' style={{marginLeft: 10}} onClick={this.testExecute}>テスト実行</Button>
          </div>
        </div>
        <div style={styles.right}>
          <Field name='source' component={renderRadioGroup} row>
            <FormControlLabel value='actions' control={<Radio />} label='手動' />
            <FormControlLabel value='script' control={<Radio />} label='スクリプト' />
          </Field>
          {this.props.source === 'script' ?
            <Field name='script' component={renderJavaScript} />
          :
            <FieldArray name='actions' component={renderActions} setMode={this.setMode} />
          }
        </div>
        <Dialog
          open={!!executeResult}
          onClose={() => this.setState({executeResult: false})}
        >
          <div style={styles.dialog}>
            {executeResult === 'progress' ? [
              <h3 key='title'>実行中です・・・</h3>,
              <div key='progress' style={styles.progress}><CircularProgress /></div>,
            ] : executeResult ? [
              <h3 key='title'>実行結果</h3>,
              <div key='code' style={styles.code}>{JSON.stringify(executeResult, null, '\t')}</div>,
            ] : null}
          </div>
        </Dialog>
      </form>
    )
  }
}

const renderJavaScript = withStyles({
  codemirror: {
    height: '100%',
    '& .CodeMirror': {
      height: '100% !important',
    },
  },
})(props => {
  const { classes, input: { onChange, value } } = props
  return (
    <CodeMirror
      onBeforeChange={(editor, data, value) => onChange(value)}
      value={value}
      className={classes.codemirror}
      options={{
        mode: { name: 'javascript', json: true },
        theme: 'material',
        lineNumbers: true,
        lineWrapping: true,
        smartIndent: true,
        tabSize: 2,
      }}
    />
  )
})

@connect(
  (state, props) => {
    return {actions: props.actions || selector(state, props.fields.name) || []}
  },
)
class renderActions extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const { fields, actions, setMode } = this.props
    const { typeAnchor } = this.state

    const styles = {
      root: {
        marginBottom: 5,
        border: `1px solid ${grey[300]}`,
      },
      title: {
        paddingLeft: 10,
        background: grey[200],
        display: 'flex',
        alignItems: 'center',
      },
      body: {
        background: grey[50],
        padding: '4px 8px',
      },
    }

    let prevCurrentPage = true

    return (
      <div>
        {fields.map((f, index, fields) => {
          const { type, name } = actions[index] || {}

          const currentPage = prevCurrentPage
          if (['click', 'link'].includes(type)) prevCurrentPage = false

          return (
            <div key={index}>
              <details style={{...styles.root}}>
                <summary style={styles.title}>
                  <span>{actionFields[type].label} {name}</span>
                  <div style={{flex: 1}} />
                  {index > 0 &&
                    <UpIcon onClick={e => index > 0 && e.preventDefault() || fields.move(index, index - 1)} style={{cursor: 'pointer'}} />
                  }
                  {index < fields.length - 1 ?
                    <DownIcon onClick={e => e.preventDefault() || fields.move(index, index + 1)} style={{cursor: 'pointer'}} />
                  :
                    <div style={{width: 24}} />
                  }
                  <CloseIcon onClick={e => e.preventDefault() || fields.remove(index)} style={{cursor: 'pointer'}} />
                </summary>
                <div style={styles.body}>
                  {actionFields[type].selector && <Field label='セレクタ' name={`${f}.selector`} component={renderTextInput} onFocus={() => setMode({mode: type, field: `${f}.selector`, currentPage})} onBlur={() => setMode({})} />}
                  {actionFields[type].attr && <Field label='属性名' name={`${f}.attr`} component={renderTextInput} />}
                  {actionFields[type].name && <Field label='保存名' name={`${f}.name`} component={renderTextInput} />}
                  {actionFields[type].match && <Field label='正規マッチ' name={`${f}.match`} component={renderTextInput} />}
                  {actionFields[type].url && <Field label='URL' name={`${f}.url`} component={renderTextInput} />}
                  {actionFields[type].ms && <Field label='時間(ms)' name={`${f}.ms`} component={renderTextInput} type='number' />}
                  {actionFields[type].value && <Field label='値' name={`${f}.value`} component={renderTextInput}  />}
                </div>
              </details>
              {type === 'foreach' &&
                <div style={{display: 'flex', marginBottom: 10}}>
                  <div style={{marginRight: 5}}>┗</div>
                  <div style={{flex: 1}}>
                    <FieldArray name={`${f}.actions`} actions={actions[index].actions} component={renderActions} setMode={values => setMode({selector: actions[index].selector, ...values})} />
                  </div>
                </div>
              }
              {type === 'if' && [
                <div key='then' style={{display: 'flex', marginBottom: 10}}>
                  <div style={{marginRight: 5}}>┗</div>
                  <div style={{flex: 1}}>
                    <FieldArray name={`${f}.then`} actions={actions[index].then} component={renderActions} setMode={setMode} />
                  </div>
                </div>,
                <div key='else' style={{display: 'flex', marginBottom: 10}}>
                  <div style={{marginRight: 5}}>┗</div>
                  <div style={{flex: 1}}>
                    <FieldArray name={`${f}.else`} actions={actions[index].else} component={renderActions} setMode={setMode} />
                  </div>
                </div>,
              ]}
            </div>
          )
        })}
        <Button size='small' variant='outlined' onClick={e => this.setState({typeAnchor: e.currentTarget})}>追加</Button>
        <Menu
          open={!!typeAnchor}
          anchorEl={typeAnchor}
          onClose={() => this.setState({typeAnchor: null})}
        >
          {Object.keys(actionFields).map((type, i) =>
            <MenuItem key={i} onClick={() => fields.push({type}) && this.setState({typeAnchor: null})}>{actionFields[type].label}</MenuItem>
          )}
        </Menu>
      </div>
    )
  }
}
