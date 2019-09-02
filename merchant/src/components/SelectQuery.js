import React from 'react'
import { Paper, Radio, Checkbox } from '@material-ui/core'
import { FormControl, FormControlLabel, FormGroup } from '@material-ui/core'
import NavigationCheck from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
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
    width: '29%',
    margin: 8,
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('xs')]: {
      width: '42%',
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
  answer: {
    fontSize: 13,
    fontWeight: 'bold',
    padding: 5,
    textAlign: 'center',
  },
  selectableForm: {
    background: theme.palette.common.white,
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    display: 'block',
  },
  option: {
    width: '29%',
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '42%',
    },
  },
  // for tools
  closeButton: {
    position: 'absolute',
    top: 0,
    right: -24,
    cursor: 'pointer',
  },
}))
export default class SelectQuery extends React.Component {

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
  }

  select = (option) => {
    const answers = this.props.answers.map(a => ({
      ...a,
      checked: a._id === option._id,
    }))
    this.props.onChange(answers)
  }

  render() {
    const { query, answers, disabled, classes, className, onRemove } = this.props

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
                {onRemove && <CloseIcon className={classes.closeButton} onClick={() => onRemove(query, answer)} />}
              </Paper>
            )}
            {[...Array(3)].map((_, i) => <div key={i} className={classes.option} />)}
          </div>,
          answers.filter(a => !a.image).length > 0 &&
          <FormControl key='list' className={[classes.selectableForm, className].join(' ')}>
            <FormGroup>
            {answers.filter(a => !a.image).map(answer =>
              <div key={`option_${answer._id}`} className={classes.selectWrap}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color='primary'
                      disabled={disabled}
                      checked={!!answer.checked}
                      onClick={() => this.toggle(answer)}
                    />
                  }
                  className={classes.select}
                  label={answer.text}
                />
              </div>
            )}
            </FormGroup>
          </FormControl>,
        ] : query.type === 'singular' ?
          <FormControl className={[classes.selectableForm, className].join(' ')}>
            <FormGroup>
              {answers.map(answer =>
                <div key={`option_${answer._id}`} className={classes.selectWrap}>
                  <FormControlLabel
                    className={`queryLabel ${classes.select}`}
                    value={answer.text}
                    control={
                      <Radio
                        color='primary'
                        disabled={disabled}
                        checked={!!answer.checked}
                        onClick={() => this.select(answer)}
                      />
                    }
                    label={answer.text}
                  />
                  {onRemove && <CloseIcon className={classes.closeButton} onClick={() => onRemove(query, answer)} />}
                </div>
              )}
            </FormGroup>
          </FormControl>
        : query.type === 'multiple' ?
          <FormControl className={[classes.selectableForm, className].join(' ')}>
            <FormGroup>
              {answers.map(answer =>
                <div key={`option_${answer._id}`} className={classes.selectWrap}>
                  <FormControlLabel
                    className={`queryLabel ${classes.select}`}
                    control={
                      <Checkbox
                        color='primary'
                        disabled={disabled}
                        checked={!!answer.checked}
                        onClick={() => this.toggle(answer)}
                      />
                    }
                    label={answer.text}
                  />
                  {onRemove && <CloseIcon className={classes.closeButton} onClick={() => onRemove(query, answer)} />}
                </div>
              )}
            </FormGroup>
          </FormControl>
        : null}
      </div>
    )
  }
}
