import React from 'react'
import { Radio, withStyles } from '@material-ui/core'

const SatisfactionQuestion = (props) => {
  const { value, onChange, classes } = props
  return (
    <div>
      <div style={{fontSize: 18, fontWeight: 'bold'}}>SMOOOSYの印象はいかがですか？</div>
      <div className={classes.radioGroup}>
        {[...new Array(5)].map((_, idx) => {
          const v = idx + 1
          return (
            <div key={idx} className={classes.radioUnit}>
              <div style={{fontSize: 12}}>{v === 1 ? 'とても悪い' : v === 5 ? 'とても良い' : ''}</div>
              <div>{v}</div>
              <Radio
                checked={value === v}
                onChange={() => onChange(v)}
                value={v}
                color='primary'
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default withStyles({
  radioGroup: {
    display: 'flex',
    marginTop: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  radioUnit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    maxWidth: 80,
  },
})(SatisfactionQuestion)
