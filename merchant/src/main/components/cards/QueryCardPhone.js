import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, SubmissionError } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import LockIcon from '@material-ui/icons/Lock'
import renderTextInput from 'components/form/renderTextInput'
import { phoneValidator } from 'lib/validate'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { zenhan } from 'lib/string'

@connect(
  state => ({
    user: state.auth.user,
  })
)
@reduxForm({
  form: 'phone',
  initialValues: {
    phone: '',
  },
  validate: values => ({
    ...phoneValidator(zenhan(values.phone)),
  }),
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
  title: {
    padding: 24,
    fontSize: 18,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  showPhone: {
    margin: '10px 0',
  },
  comments: {
    display: 'flex',
    color: theme.palette.grey[500],
    fontSize: 13,
  },
  secureIcon: {
    width: 18,
    height: 18,
    color: orange[500],
    marginRight: 10,
  },
}))
export default class QueryCardPhone extends React.Component {

  componentDidMount() {
    const phone = this.props.phone || this.props.user.phone || ''
    if (/^[0-9\-]+$/.test(phone)) {
      this.props.initialize({phone})
      this.props.reset()
      this.props.handlePhone(null, phone)
    }
  }

  onSubmit = (values) => {
    const errors = phoneValidator(zenhan(values.phone), true)
    if (errors.phone) {
      throw new SubmissionError({phone: errors.phone})
    }
    this.props.next()
  }

  render() {
    const { onClose, progress, handleSubmit, submitting, handlePhone, classes } = this.props

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <QueryCardHeader sub='必須'>
          電話番号を入力して下さい
        </QueryCardHeader>
        <div className={classes.container}>
          <Field classes={{input: 'phoneRequireInputField'}} name='phone' component={renderTextInput} label='電話番号（必須）' type='tel' onChange={handlePhone} />
          <div className={classes.comments}>
            <LockIcon className={classes.secureIcon} />
            <div>見積もりをした最大5人のプロにのみ電話番号を表示します。</div>
          </div>
        </div>
        <QueryCardFooter
          className='nextQuery phone'
          disabledNext={submitting}
          onPrev={(event) => this.props.prev({event})}
          prevTitle='戻る'
          nextTitle='送信する'
          type='submit'
          />
      </form>
    )
  }
}
