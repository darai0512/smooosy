import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import RightIcon from '@material-ui/icons/KeyboardArrowRight'
import SearchIcon from '@material-ui/icons/Search'
import GAEventTracker from 'components/GAEventTracker'
import { withAMP } from 'contexts/amp'

@withAMP
@withStyles(theme => ({
  zip: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  zipInput: {
    flex: 1,
    height: 60,
    padding: '5px 15px',
    fontSize: 25,
    maxWidth: 300,
    minWidth: 230,
    outline: 'none',
    borderRadius: '2px 0 0 2px',
    borderWidth: '1px 0 1px 1px',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[400],
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
    [theme.breakpoints.down('xs')]: {
      minWidth: 160,
      height: 40,
      padding: '3px 8px',
      fontSize: 15,
    },
  },
  zipButton: {
    borderRadius: '0 2px 2px 0',
    height: 60,
    fontSize: 24,
    padding: '4px 16px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      height: 40,
      padding: '4px 12px',
    },
  },
  icon: {
    marginLeft: 10,
    fontSize: 32,
    [theme.breakpoints.down('xs')]: {
      fontSize: 32,
      marginLeft: 0,
    },
  },
}))
export default class ZipInput extends React.Component {
  static defaultProps = {
    gaEvent: {},
    label: '次へ',
    onEnter: () => {},
  }

  state = {}

  render() {
    const { currentPath, classes, gaEvent, label, onEnter, service, defaultZip, zipInputClass, zipButtonClass, zipIconClass = '', isAMP, position } = this.props
    const { zip } = this.state

    return (
      <form className={classes.zip} action={currentPath} method='get' onSubmit={e => e.preventDefault()} target='_top'>
        <input type='hidden' name='modal' value='true' />
        {isAMP &&
          <>
            <input type='hidden' name='ampId' value='CLIENT_ID(uid)' data-amp-replace='CLIENT_ID' />
            <input type='hidden' name='referrer' value='DOCUMENT_REFERRER' data-amp-replace='DOCUMENT_REFERRER' />
            <input type='hidden' name='canonicalPath' value='/ampCANONICAL_PATH' data-amp-replace='CANONICAL_PATH' />
          </>
        }
        {!isAMP && <input type='hidden' name='pos' value={position} />}
        <input type='hidden' name='source' value='zipbox' data-amp-replace='CANONICAL_PATH' />
        {service && <input type='hidden' name='serviceId' value={service.id} />}
        <input name='zip' className={[classes.zipInput, zipInputClass].join(' ')} placeholder='地名・郵便番号を入力' onChange={e => this.setState({zip: e.target.value})} />
        <input type='hidden' name='defaultZip' defaultValue={defaultZip} />
        <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label}>
          <Button variant='contained' color='primary' type='submit' className={['zipButton', classes.zipButton, zipButtonClass].join(' ')} onClick={() => onEnter(zip)}>
            {label}
            {label === '' ? <SearchIcon className={[classes.icon, zipIconClass].join(' ')} /> : <RightIcon className={[classes.icon, zipIconClass].join(' ')} />}
          </Button>
        </GAEventTracker>
      </form>
    )
  }
}