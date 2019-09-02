import React from 'react'
import { Paper, Radio, Checkbox } from '@material-ui/core'
import { FormControl, FormControlLabel, FormGroup } from '@material-ui/core'
import NavigationCheck from '@material-ui/icons/Check'
import { withStyles } from '@material-ui/core/styles'

import { imageSizes } from '@smooosy/config'

@withStyles(theme => ({
  root: {
  },
  images: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    alignContent: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    padding: '0 0 10px',
  },
  image: {
    width: '30%',
    margin: 8,
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('xs')]: {
      width: '43%',
    },
  },
  imageLabel: {
    width: '100%',
    height: 130,
    [theme.breakpoints.down('xs')]: {
      height: '30vw',
    },
  },
  imageChecked: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `5px solid ${theme.palette.primary.main}`,
    background: 'rgba(0, 0, 0, .5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    width: 48,
    height: 48,
    color: theme.palette.common.white,
  },
  selectWrap: {
    width: '100%',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    position: 'relative',
  },
  select: {
    padding: '0px 24px',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      padding: '0px 12px',
    },
  },
  note: {
    outline: 0,
    width: '100%',
    padding: '8px 12px',
    fontSize: 16,
    lineHeight: '24px',
    appearance: 'none',
    resize: 'vertical',
    display: 'inline-block',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ccc',
    borderRadius: 4,
    verticalAlign: 'middle',
    ':focus': {
      borderColor: '#448AFF',
    },
  },
  answer: {
    fontSize: 13,
    fontWeight: 'bold',
    padding: 5,
    textAlign: 'center',
  },
  other: {
    padding: '0 24px 12px 64px',
    [theme.breakpoints.down('xs')]: {
      padding: '0 12px 8px 52px',
    },
  },
  selectableForm: {
    background: theme.palette.common.white,
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    margin: '0 0 24px',
    display: 'block',
    [theme.breakpoints.down('xs')]: {
      margin: '0 0 16px',
    },
  },
  option: {
    width: '29%',
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '42%',
    },
  },
}))
export default class QuerySelection extends React.Component {

  constructor(props) {
    super(props)
    this.answerRefs = {}
  }

  toggle = (option) => {
    const answers = this.props.answers.map(a => ({
      ...a,
      checked: a._id === option._id ? !a.checked : a.checked,
    }))
    this.props.onChange(answers)

    if (!option.checked && option.note) {
      setTimeout(() => {
        this.answerRefs[`note_${option._id}`] && this.answerRefs[`note_${option._id}`].focus()
      }, 0)
    }
  }

  select = (option) => {
    const answers = this.props.answers.map(a => ({
      ...a,
      checked: a._id === option._id,
    }))
    this.props.onChange(answers)

    if (option.note) {
      setTimeout(() => {
        this.answerRefs[`note_${option._id}`] && this.answerRefs[`note_${option._id}`].focus()
      }, 0)
    }
  }

  handleNoteChange = (event, option, fn) => {
    const answers = this.props.answers.map(a => ({
      ...a,
      noteText: option._id === a._id ? event.target.value : null,
    }))
    this.props.onChange(answers)

    const shouldCheck = event.target.value && event.target.value.length > 0
    if (option.checked !== shouldCheck) {
      fn(option)
    }
  }

  render() {
    const { query, answers, classes } = this.props

    const imageOptions = answers.filter(a => a.image).length > 0

    return (
      <div className={classes.root}>
        {imageOptions ? [
          <div key='images' className={classes.images}>
            {answers.filter(a => a.image).map(answer =>
              <Paper className={classes.image} onClick={() => this.toggle(answer)} key={`option_${answer._id}`}>
                <div className={`${classes.imageLabel} queryLabel`} style={{background: `url(${answer.image}${imageSizes.c320}) center/cover`}} />
                <div className={classes.answer}>{answer.text}</div>
                {answer.checked ?
                  <div className={classes.imageChecked}>
                    <NavigationCheck className={classes.check} />
                  </div>
                : null}
              </Paper>
            )}
            {[...Array(3)].map((_, i) => <div key={i} className={classes.option} />)}
          </div>,
          answers.filter(a => !a.image).length > 0 &&
          <FormControl key='list' className={classes.selectableForm}>
            <FormGroup>
            {answers.filter(a => !a.image).map(answer =>
              <div key={`option_${answer._id}`} className={classes.selectWrap}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color='primary'
                      checked={!!answer.checked}
                      onClick={() => this.toggle(answer)}
                    />
                  }
                  className={classes.select}
                  label={answer.text}
                />
                <NoteInput
                  answer={answer}
                  classes={classes}
                  setRef={e => this.answerRefs[`note_${answer._id}`] = e}
                  onChange={event => this.handleNoteChange(event, answer, this.toggle)}
                />
              </div>
            )}
            </FormGroup>
          </FormControl>,
        ] : query.type === 'singular' ?
          <FormControl className={classes.selectableForm}>
            <FormGroup>
              {answers.map(answer =>
                <div key={`option_${answer._id}`} className={classes.selectWrap}>
                  <FormControlLabel
                    className={`queryLabel ${classes.select}`}
                    value={answer.text}
                    control={
                      <Radio
                        color='primary'
                        checked={!!answer.checked}
                        onClick={() => this.select(answer)}
                      />
                    }
                    label={answer.text}
                  />
                  <NoteInput
                    answer={answer}
                    classes={classes}
                    setRef={e => this.answerRefs[`note_${answer._id}`] = e}
                    onChange={event => this.handleNoteChange(event, answer, this.select)}
                  />
                </div>
              )}
            </FormGroup>
          </FormControl>
        : query.type === 'multiple' ?
          <FormControl className={classes.selectableForm}>
            <FormGroup>
              {answers.map(answer =>
                <div key={`option_${answer._id}`} className={classes.selectWrap}>
                  <FormControlLabel
                    className={`queryLabel ${classes.select}`}
                    control={
                      <Checkbox
                        color='primary'
                        checked={!!answer.checked}
                        onClick={() => this.toggle(answer)}
                      />
                    }
                    label={answer.text}
                  />
                  <NoteInput
                    answer={answer}
                    classes={classes}
                    setRef={e => this.answerRefs[`note_${answer._id}`] = e}
                    onChange={event => this.handleNoteChange(event, answer, this.toggle)}
                  />
                </div>
              )}
            </FormGroup>
          </FormControl>
        : null}
      </div>
    )
  }
}

const NoteInput = ({answer, classes, setRef, onChange}) => (
  <>
    {answer.note === 'text' ?
      <div className={classes.other}>
        <input
          type='text'
          className={classes.note}
          placeholder={answer.notePlaceholder}
          defaultValue={answer.noteText}
          ref={setRef}
          onChange={onChange}
        />
      </div>
    : answer.note === 'textarea' ?
      <div className={classes.other}>
        <textarea
          className={classes.note}
          placeholder={answer.notePlaceholder}
          defaultValue={answer.noteText}
          ref={setRef}
          onChange={onChange}
        />
      </div>
    : null}
  </>
)

