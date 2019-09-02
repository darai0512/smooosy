import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import AlertWarning from '@material-ui/icons/Warning'


@withStyles({
  price: {
    outline: 0,
    maxWidth: 300,
    width: '80%',
    height: 80,
    fontSize: 60,
    appearance: 'none',
    display: 'inline-block',
    borderRadius: 0,
    borderWidth: '0 0 1px',
    borderStyle: 'solid',
    verticalAlign: 'middle',
  },
  unit: {
    padding: 10,
    fontSize: 20,
    verticalAlign: 'bottom',
    lineHeight: '24px',
  },
}, {withTheme: true})
export default class renderPrice extends React.PureComponent {
  render() {
    const {disabled, label, style, input, meta, classes, theme, ...custom} = this.props
    const err = meta.touched && meta.error
    const { grey, red } = theme.palette

    return (
      <label style={style || {}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1, fontSize: 13, fontWeight: 'bold', color: err ? red[500] : grey[500]}}>{label}</div>
        </div>
        <input
          {...input}
          {...custom}
          className={classes.price}
          style={{borderColor: err ? red[500] : grey[400], textAlign: disabled ? 'center' : 'right'}}
          pattern='\d*'
          disabled={disabled}
          value={disabled ? '未確定' : input.value}
        />
        <span className={classes.unit}>円</span>
        <div style={{height: 30, fontSize: 12, color: red[500], padding: 5}}>
          {err && <p><AlertWarning style={{verticalAlign: 'bottom', width: 18, height: 18, color: red[500]}} />{err}</p>}
        </div>
      </label>
    )
  }
}
