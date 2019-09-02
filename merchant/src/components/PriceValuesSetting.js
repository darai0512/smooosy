import React from 'react'
import { Field, FieldArray } from 'redux-form'
import { withStyles } from '@material-ui/core/styles'
import { Button, IconButton, Divider } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Close'

import renderNumberInput from 'components/form/renderNumberInput'
import renderCheckbox from 'components/form/renderCheckbox'
import { combinations } from 'lib/array'

const PriceValuesSetting = ({baseQueries, discountQueries, addonQueries, singleBasePriceQuery, disabled, allowsTravelFee, estimatePriceType = 'fixed', classes, baseRequired}) => (
  <>
    <h4>基本料金</h4>
    <div className={classes.card}>
      {singleBasePriceQuery && <SingleBasePriceField disabled={disabled} query={singleBasePriceQuery} estimatePriceType={estimatePriceType} classes={classes} required={baseRequired} />}
      <BasePriceFields queries={baseQueries} disabled={disabled} estimatePriceType={estimatePriceType} classes={classes} required={baseRequired} />
    </div>
    {discountQueries.length > 0 &&
      <>
        <h4>割引</h4>
        <div className={classes.card}>
          {discountQueries.map(q =>
            <PriceRows
              key={q.id}
              showText
              query={q}
              disabled={disabled}
              classes={classes}
              type='percentage'
              nameFunction={v => `discount.${v}`}
            />
          )}
        </div>
      </>
    }
    {addonQueries.length > 0 &&
      <>
        <h4>追加料金</h4>
        <div className={classes.card}>
          {addonQueries.map(q =>
            <PriceRows
              key={q.id}
              showText
              query={q}
              disabled={disabled}
              classes={classes}
              nameFunction={v => `addon.${v}`}
            />
          )}
        </div>
      </>
    }
    {allowsTravelFee &&
      <>
        <h4>交通費</h4>
        <div className={classes.card}>
          <Field
            name={'chargesTravelFee'}
            component={renderCheckbox}
            disabled={disabled}
            label={'料金に交通費を追加する'}
          >
            {value => value && <TravelFeeRows disabled={disabled} classes={classes} />}
          </Field>
        </div>
      </>
    }
  </>
)

export default withStyles(theme => ({
  card: {
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    padding: 10,
    marginBottom: 30,
  },
  question: {
    marginBottom: 20,
  },
  subTitle: {
    fontWeight: 'bold',
    padding: '5px 0',
  },
  helperText: {
    paddingBottom: 5,
    color: theme.palette.grey[700],
    fontSize: 14,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  editButton: {
    padding: '8px 16px',
    [theme.breakpoints.down('xs')]: {
      padding: '8px 4px',
    },
  },
  borderTop: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
}))(PriceValuesSetting)

const SingleBasePriceField = ({query, estimatePriceType, classes, disabled, required = true}) => {
  return (
    <PriceRows
      base
      showText
      required={required}
      query={query}
      disabled={disabled}
      estimatePriceType={estimatePriceType}
      classes={classes}
      nameFunction={() => 'singleBase.singleBase'}
    />
  )
}

const BasePriceFields = ({queries, disabled, estimatePriceType, classes, required = true}) => {
  if (queries.length === 1) {
    const query = queries[0]
    return (
      <div className={classes.question}>
        <PriceRows
          base
          showText
          required={required}
          query={query}
          disabled={disabled}
          estimatePriceType={estimatePriceType}
          classes={classes}
          nameFunction={v => `base.${v.sort().join('+')}`}
        />
      </div>
    )
  } else if (queries.length === 2) {
    return (
      <>
        {queries[0].options.map(o =>
          <div key={o.id} className={classes.question}>
            <div className={classes.subTitle}>{queries[0].proText}: {o.text}</div>
            <PriceRows
              base
              required={required}
              query={queries[1]}
              disabled={disabled}
              estimatePriceType={estimatePriceType}
              nameFunction={v => `base.${[o.id, ...v].sort().join('+')}`}
              classes={classes}
            />
          </div>
        )}
      </>
    )
  }

  return null
}

const inputProps = ({type, unit, estimatePriceType}) => {
  const props = {
    yen: {
      beforeLabel: estimatePriceType === 'float' ? '概算' : '',
      afterLabel: '円',
      min: 0,
    },
    percentage: {
      afterLabel: '%',
      min: 0,
      max: 100,
    },
  }[type]
  if (unit) props.afterLabel += '/' + unit
  if (estimatePriceType === 'minimum') props.afterLabel += '〜'

  return props
}

// create option combinations for query(type = 'multiple')
export const combineOptions = options => combinations(options).map(comb => ({
  ids: comb.map(o => o.id),
  text: comb.map(o => o.text).join('＋'),
}))

const PriceRows = ({query, base, type = 'yen', disabled, estimatePriceType, nameFunction, classes, showText, required}) => (
  <>
    {showText &&
      <>
        <div className={classes.subTitle}>{query.proText}</div>
        <div className={classes.helperText}>{query.proPriceHelperText}</div>
        <Divider />
      </>
    }
    {(
      query.type === 'multiple' && base ? combineOptions(query.options.filter(o => o.usedForPro)) :
      query.options.filter(o => o.usedForPro)
    ).map((o, i) =>
      <div key={i} className={classes.row}>
        <div>{o.text}</div>
        <div style={{flex: 1}} />
        <Field
          disabled={disabled}
          name={nameFunction(o.ids || [o.id])}
          component={renderNumberInput}
          {...inputProps({type, unit: o.unit, estimatePriceType})}
          style={{display: 'flex', alignItems: 'center'}}
          inputStyle={{width: 100, textAlign: 'center'}}
          required={required}
          hideError
        />
      </div>
    )}
  </>
)

const TravelFeeRows = ({classes, disabled}) => (
  <>
    <FieldArray
      name='travelFee'
      component={renderTravelFees}
      props={{classes, disabled}}
    />
  </>
)

const renderTravelFees = ({ classes, fields, disabled }) => (
  <>
  <div className={classes.borderTop}>
    {fields.map((travelFee, index) => (
      <div
        key={index}
        className={classes.row}
      >
        <Field
          name={`${travelFee}.minDistance`}
          component={renderNumberInput}
          format={v => v ? v / 1000 : undefined}
          parse={v => parseFloat(v) * 1000}
          afterLabel='km以上'
          min={1}
          style={{display: 'flex', alignItems: 'center'}}
          inputStyle={{width: 60, textAlign: 'center'}}
          disabled={disabled}
          hideError
        />
        <div style={{flex: 1}} />
        <Field
          name={`${travelFee}.price`}
          component={renderNumberInput}
          style={{display: 'flex', alignItems: 'center'}}
          inputStyle={{width: 80, textAlign: 'center'}}
          disabled={disabled}
          hideError
          {...inputProps({type: 'yen'})}
        />
        <IconButton disabled={disabled} className={classes.deleteIcon} onClick={() => fields.remove(index)}><DeleteIcon className={classes.deleteIcon} /></IconButton>
      </div>
    ))}
  </div>
  <div style={{display: 'flex', justifyContent: 'center'}}>
    <Button disabled={disabled} color='primary' className={classes.editButton} onClick={() => fields.push({})}>距離設定を追加する</Button>
  </div>
  </>
)
