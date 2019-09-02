import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { withStyles} from '@material-ui/core/styles'
import renderTextArea from 'components/form/renderTextArea'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'

@connect(
  state => ({
    values: (state.form.text || {}).values || {},
  })
)
@reduxForm({
  form: 'text',
  validate: (values, props) => {
    const errors = {}
    if (props.query.subType === 'required' && !values.text) {
      errors.text = '必須項目です'
    }
    return errors
  },
})
@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    background: '#fafafa',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    height: 600,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
    },
  },
  container: {
    padding: '0 24px 24px',
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      padding: '0 16px 16px',
    },
  },
  require: {
    marginLet: 10,
    fontSize: 14,
  },
}))
export default class QueryCardTextarea extends React.Component {
  UNSAFE_componentWillMount() {
    this.set(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.query.id !== nextProps.query.id) this.set(nextProps)
  }

  set = ({query}) => {
    const text = query.answers && query.answers[0] && query.answers[0].text ? query.answers[0].text : ''
    this.props.initialize({text})
    this.props.reset()
  }

  next = (values) => {
    this.props.next({queryId: this.props.query.id, answers: [values]})
  }

  prev = () => {
    const { values } = this.props
    this.props.prev({queryId: this.props.query.id, answers: [values]})
  }

  render() {
    const { query, isFirstQuery, isLastQuery, onClose, progress, handleSubmit, invalid, submitting, classes } = this.props

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.next)}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div className={classes.container}>
          <QueryCardHeader sub={query.subType === 'required' ? '必須' : '任意'} helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          <Field classes={{textarea: 'textareaField'}} name='text' placeholder={query.placeholder} component={renderTextArea} textareaStyle={{height: 180}} />
        </div>
        <QueryCardFooter
          className='nextQuery textarea'
          disabledNext={invalid || submitting}
          onPrev={isFirstQuery ? null : () => this.prev()}
          prevTitle='戻る'
          nextTitle={isLastQuery ? '送信する' : '次へ'}
          type='submit'
          />
      </form>
    )
  }
}
