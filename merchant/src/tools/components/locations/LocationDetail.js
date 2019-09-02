import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { Button, FormControl, InputLabel, Menu, MenuItem, Chip, Select, Avatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Public from '@material-ui/icons/Public'

import { loadLocationAll as loadProfiles } from 'tools/modules/profile'
import { load, create, update, remove, getNearLocations } from 'tools/modules/location'
import { open as openSnack } from 'tools/modules/snack'
import renderTextInput from 'components/form/renderTextInput'
import renderSelect from 'components/form/renderSelect'
import LocationMap from 'tools/components/locations/LocationMap'

@connect(
  state => ({
    currentLocation: state.location.location,
    childLocations: state.location.childLocations,
    nearLocations: state.location.nearLocations,
    locationProfiles: state.profile.locationProfiles,
  }),
  { load, create, update, remove, loadProfiles, getNearLocations, openSnack }
)
@withStyles({
  root: {
    height: '100%',
    overflowY: 'auto',
    padding: 20,
  },
  base: {
    boxShadow: 'none',
  },
  expandedPanel: {
    margin: 0,
  },
})
@reduxForm({
  form: 'location',
  validate: values => {
    const errors = {}
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (!values.key) {
      errors.key = '必須項目です'
    }
    return errors
  },
})
@withRouter
export default class LocationDetail extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      loc: {
        type: 'Point',
        coordinates: [139.7648575, 35.6811673],
      },
      distance: 10000,
      loaded: false,
      near: 'location',
      group: [],
      groupAnchor: null,
    }
    this.markerProfileRef = {}
    this.markerLocationRef = {}
  }

  onClickMarker = (id, type) => {
    const {history} = this.props
    if (type === 'profile') {
      history.push(`/stats/pros/${id}`)
    }
    if (type === 'location') {
      this.clickNextLocation(`/locations/${id}`)
    }
  }

  onMouseOverMarker = (id, type) => {
    const {nearLocations, locationProfiles} = this.props

    if (type === 'profile' && this.markerProfileRef[id]) {
      const p = locationProfiles.map(lp => lp.profiles.map(p => ({id: p.id, name: p.name}))).reduce((sum, current) => sum.concat(current), []).filter(p => p.id === id)
      const el = this.markerProfileRef[id].parentNode
      const msg = document.createElement('span')
      msg.style.background = 'white'
      msg.style.whiteSpace = 'nowrap'
      msg.style.position = 'relative'
      msg.style.zIndex = '2000000'
      msg.innerText = p.length > 0 ? p[0].name : ''
      msg.id = 'msg_' + id
      msg.style.left = `${-msg.innerText.length * 12 / 2}px`
      el.parentNode.insertBefore(msg, el.nextSibling)
    }
    if (type === 'location' && this.markerLocationRef[id]) {
      const l = nearLocations.filter(l => l.id === id)
      const el = this.markerLocationRef[id].parentNode
      const msg = document.createElement('span')
      msg.style.background = 'white'
      msg.style.whiteSpace = 'nowrap'
      msg.style.position = 'relative'
      msg.style.zIndex = '2000000'
      msg.innerText = l.length > 0 ? l[0].name : ''
      msg.id = 'msg_' + id
      msg.style.left = `${-msg.innerText.length * 12 / 2}px`
      el.parentNode.insertBefore(msg, el.nextSibling)
    }
  }

  onMouseOutMarker = (id) => {
    if (this.markerProfileRef[id] || this.markerLocationRef[id]) {
      const msg = document.querySelector(`#msg_${id}`)
      if (msg) {
        msg.parentNode.removeChild(msg)
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.setState({loaded: false})
      this.load(this.props.match.params.id, this.props.location.pathname)
    }
  }

  componentDidMount() {
    this.load(this.props.match.params.id, this.props.location.pathname)
  }

  componentWillUnmount() {
    this.markerProfileRef = {}
    this.markerLocationRef = {}
  }

  load = (id, pathname) => {
    const isLocationNew = /^\/locations\/.*\/new/.test(pathname)
    const isGroupNew = /^\/locationGroups\/.*\/new/.test(pathname)
    const isGroup = /^\/locationGroups\/.*/.test(pathname)
    this.props.load(id, isGroup)
      .then(({location}) => {
        const [lng, lat] = location.loc ? location.loc.coordinates : [0, 0]
        const distance = location.distance
        if (isGroupNew) {
          location.group = [location]
        }
        this.setState({ loaded: true, loc: {type: 'Point', coordinates: [lng, lat]}, distance, near: 'location', group: location.group })
        this.props.loadProfiles({locations: isGroup ? location.group.map(g => ({lat: g.loc.coordinates[1], lng: g.loc.coordinates[0], distance: g.distance})) : [{lat, lng, distance}]})
        if (isLocationNew) {
          this.props.initialize({ parentName: location.name, parentKey: location.key, isPublished: 'false'})
        } else if (isGroupNew) {
          this.props.initialize({ parentName: location.path.split(',')[0], parentKey: location.keyPath.split(',')[0], isPublished: 'false'})
        } else {
          this.props.initialize({...location, isPublished: location.isPublished ? 'true' : 'false'})
        }
      })
  }

  onMapChange = ({lat, lng, distance}) => {
    this.setState({
      loc: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      distance,
    })
  }

  reloadLocationMarkers = () => {
    const { loc, distance, group } = this.state
    const isGroup = /^\/locationGroups\/.*/.test(this.props.location.pathname)
    this.props.loadProfiles({locations: isGroup ? group.map(g => ({lat: g.loc.coordinates[1], lng: g.loc.coordinates[0], distance: g.distance})) : [{lat: loc.coordinates[1], lng: loc.coordinates[0], distance}]})
    this.props.getNearLocations({id: this.props.match.params.id, lat: loc.coordinates[1], lng: loc.coordinates[0], distance, isLocationGroup: isGroup})
  }

  handleSubmit = (values) => {
    const { currentLocation, match: { params: { id } } } = this.props
    const { loc, distance, group } = this.state
    const isLocationNew = /^\/locations\/.*\/new/.test(this.props.location.pathname)
    const isGroupNew = /^\/locationGroups\/.*\/new/.test(this.props.location.pathname)
    if (isLocationNew || isGroupNew) {
      values.isPublished = values.isPublished === 'true'
      return this.props.create({
        ...values,
        keyPath: isLocationNew ? currentLocation.keyPath + ',' + values.key : currentLocation.keyPath.split(',')[0] + ',' + values.key,
        path: isLocationNew ? currentLocation.path + ',' + values.name : currentLocation.path.split(',')[0] + ',' + values.name,
        depth: isLocationNew ? currentLocation.depth + 1 : 1,
        loc,
        distance,
        group: group.map(g => g.id),
      })
      .then(this.props.history.push('/locations'))
    }

    let path = currentLocation.path.split(',')
    if (path.length > 1) {
      path.pop()
      path.push(values.name)
      path = path.join(',')
    } else {
      path = values.name
    }
    let keyPath = currentLocation.keyPath.split(',')
    if (keyPath.length > 1) {
      keyPath.pop()
      keyPath.push(values.key)
      keyPath = keyPath.join(',')
    } else {
      keyPath = values.keyPath
    }
    return this.props.update(id, {
      ...values,
      isPublished: values.isPublished === 'true',
      keyPath,
      path,
      loc,
      distance,
      group: group.map(g => g.id),
    }).then(() => this.props.openSnack('更新しました'))
  }

  handleRemove = () => {
    this.props.remove(this.props.currentLocation.id)
     .then(this.props.history.push('/locations'))
  }

  clickNextLocation = (url) => {
    this.setState({loaded: false})
    this.props.history.push(url)
  }

  addGroups = (location) => {
    const {group} = this.state
    if (group.filter(sl => sl.id === location.id).length === 0) {
      this.setState({group: [...group, location], groupAnchor: null})
      setTimeout(() => {
        this.reloadLocationMarkers()
      }, 1000)
    }
  }

  removeGroups = (id) => {
    this.setState({group: this.state.group.filter(sl => sl.id !== id)})
    setTimeout(() => {
      this.reloadLocationMarkers()
    }, 1000)
  }

  render() {
    const { loaded, loc, distance, near, group, groupAnchor } = this.state
    const { currentLocation, childLocations, nearLocations, classes, locationProfiles, handleSubmit, invalid, submitting, match: { params: { id } } } = this.props

    if (!loaded) return null
    const isLocationNew = /^\/locations\/.*\/new/.test(this.props.location.pathname)
    const isLocationEdit = /^\/locations\/.*/.test(this.props.location.pathname) && !isLocationNew
    const isGroupNew = /^\/locationGroups\/.*\/new/.test(this.props.location.pathname)
    const isGroupEdit = /^\/locationGroups\/.*/.test(this.props.location.pathname) && !isGroupNew
    const isEdit = !isLocationNew && !isGroupNew
    const isGroup = isGroupNew || isGroupEdit

    const mapinfo = {
      lat: loc.coordinates[1],
      lng: loc.coordinates[0],
      distance,
      showMap: true,
    }

    const markers = []

    if (near === 'location') {
      markers.push(...nearLocations.map(nl => ({
        id: nl.id,
        type: 'location',
        lat: nl.loc.coordinates[1],
        lng: nl.loc.coordinates[0],
        distance: nl.distance,
      })))
    } else if (near === 'profile') {
      markers.push(...locationProfiles.map(lp => lp.profiles.map(p => ({
        id: p.id,
        type: 'profile',
        lat: p.loc.coordinates[1],
        lng: p.loc.coordinates[0],
      }))).reduce((sum, current) => sum.concat(current), []))
    }

    const groupMarkers = group.map(g => ({
      id: g.id,
      type: 'location',
      lat: g.loc.coordinates[1],
      lng: g.loc.coordinates[0],
      distance: g.distance,
    }))

    // 現在公開中で一つでも子地域が公開中だったら、非公開にできない
    const disableChangePublished = currentLocation.isPublished && childLocations.filter(cl => cl.isPublished).length > 0

    return (
      <form className={classes.root}>
        <h3>{isLocationNew ? '地域追加画面' : isGroupNew ? '統合地域作成画面' : isGroupEdit ? '統合地域編集画面' : '地域編集画面'}{isEdit && currentLocation.code && `(地域コード: ${currentLocation.code})`}</h3>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
          <Button
            size='small'
            variant='contained'
            onClick={() => this.props.history.goBack()}
            color='secondary'
          >
            戻る
          </Button>
          <div>
            { isLocationEdit && currentLocation.path && currentLocation.path.split(',').length < 3 &&
              <Button
                style={{marginRight: 20}}
                variant='contained'
                color='primary'
                onClick={() => this.clickNextLocation(`/locations/${id}/new`)}
              >
                子地域追加
              </Button>
            }
            { isEdit && currentLocation.isStation &&
              <Button
                style={{marginRight: 20}}
                variant='contained'
                color='primary'
                onClick={() => this.clickNextLocation(`/locationGroups/${id}/new`)}
              >
                統合エリア作成
              </Button>
            }
            {
              <Button
                variant='contained'
                disabled={invalid || submitting}
                onClick={handleSubmit(this.handleSubmit)}
                color='primary'
              >
                {isLocationNew || isGroupNew ? '追加する' : '更新する'}
              </Button>
            }
            {
              isEdit && currentLocation.parentKey !== 'japan' && !currentLocation.code && childLocations.length === 0 &&
                <Button
                  style={{marginLeft: 20}}
                  variant='contained'
                  onClick={this.handleRemove}
                  color='secondary'
                >
                  削除する
                </Button>
            }
          </div>
        </div>
        <Field name='isPublished' label='公開ステータス' component={renderSelect} fullWidth={true} style={{marginBottom: 16}} disabled={disableChangePublished}>
          <MenuItem button key='published' value='false' >非公開</MenuItem>
          <MenuItem button key='unpublished' value='true' >公開</MenuItem>
        </Field>
        <div style={{display: currentLocation && currentLocation.parentKey !== 'japan' ? '' : 'none'}} >
          <Field name='parentName' component={renderTextInput} label='親地域名' type='text' disabled />
          <Field name='parentKey' component={renderTextInput} label='親地域名(英語)' type='text' disabled />
        </div>
        <Field name='name' component={renderTextInput} label='地域名' type='text' disabled={!isLocationNew && childLocations.length > 0} />
        <Field name='key' component={renderTextInput} label='地域名(英語)' type='text' disabled={!isLocationNew && childLocations.length > 0} />
        { isGroup &&
          <div>
            <h4 style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>統合地域</h4>
            <Button size='small' variant='contained' style={{marginRight: 5}} onClick={e => this.setState({groupAnchor: e.currentTarget})}>追加</Button>
            {
              <Menu
                open={!!groupAnchor}
                anchorEl={groupAnchor}
                onClose={() => this.setState({groupAnchor: null})}
                MenuListProps={{style: {padding: 0}}}
              >
                {
                  nearLocations.filter(nl => !group.includes(nl)).map(nl =>
                    <MenuItem key={`select_${nl.id}`} onClick={() => this.addGroups(nl)}>{nl.name}</MenuItem>
                  )
                }
              </Menu>
            }
            {group.map(g => <Chip key={`selected_${g.id}`} label={g.name} avatar={g.isPublished ? <Avatar><Public style={{color: 'blue'}}/></Avatar> : null} onClick={() => this.clickNextLocation(`/locations/${g.id}`)} onDelete={isGroupNew && currentLocation.id === g.id ? null : () => this.removeGroups(g.id)} style={{marginTop: 5, marginRight: 5}} />)}
          </div>
        }
        <LocationMap
          markers={markers}
          onMapChange={this.onMapChange}
          mapinfo={mapinfo}
          groupMarkers={groupMarkers}
          id={id}
          onClickMarker={this.onClickMarker}
          onMouseOverMarker={this.onMouseOverMarker}
          onMouseOutMarker={this.onMouseOutMarker}
          markerRef={(el) => {
            if (el && el.hasAttributes()) {
              el.style.cursor = 'default'
              switch (el.getAttribute('data-type')) {
                case 'profile':
                  this.markerProfileRef[el.getAttribute('data-id')] = el
                  break
                case 'location':
                  this.markerLocationRef[el.getAttribute('data-id')] = el
                  break
                default:
              }
            }
          }}
        />
        <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
          <FormControl style={{marginRight: 20}}>
            <InputLabel htmlFor='inputLabel'>近くの表示情報</InputLabel>
            <Select
              value={near}
              onChange={(e) => this.setState({near: e.target.value})}
              inputProps={{
                id: 'inputLabel',
              }}
            >
              <MenuItem value='location'>近くの地域</MenuItem>
              <MenuItem value='profile'>{isGroup ? '選択地域に含まれるプロ' : '近くのプロ'}</MenuItem>
            </Select>
          </FormControl>
          <Button size='small' variant='contained' color='primary' onClick={() => this.reloadLocationMarkers()}>地図マーカー取得</Button>
        </div>
        {
          !isLocationNew && childLocations.length > 0 &&
          <details>
            <summary>子地域名({childLocations.length})</summary>
            <dl style={{paddingLeft: 20}}>
              {childLocations.map(l => <a key={`${l.id}_child`} onClick={() => this.clickNextLocation(`/locations/${l.id}`)} style={{marginRight: 20}}>{l.name}{l.isPublished && <Public style={{width: 15, height: 15, color: 'blue'}}/>}</a>)}
            </dl>
          </details>
        }
        {
          nearLocations.length > 0 &&
          <details>
            <summary>近くの地域({nearLocations.length})</summary>
            <dl style={{paddingLeft: 20}}>
              {nearLocations.map(l => <a key={`${l.id}_near`} onClick={() => this.clickNextLocation(`/locations/${l.id}`)} style={{marginRight: 20}}>{l.name}{l.isPublished && <Public style={{width: 15, height: 15, color: 'blue'}}/>}</a>)}
            </dl>
          </details>
        }
        {
          locationProfiles.length > 0 &&
          <details>
            <summary>近くのプロ({locationProfiles.reduce((sum, current) => sum + current.count, 0)})</summary>
            <dl style={{paddingLeft: 20}}>
              {locationProfiles.map(lp => (
                <details key={lp.category}>
                  <summary>{`${lp.category}(${lp.count})`}</summary>
                  <dl style={{paddingLeft: 20}}>
                    {lp.profiles.map(p => <Link key={p.id} to={`/stats/pros/${p.id}`} style={{marginRight: 20}}>{p.name}</Link>)}
                  </dl>
                </details>
              ))}
            </dl>
          </details>
        }
      </form>
    )
  }
}


