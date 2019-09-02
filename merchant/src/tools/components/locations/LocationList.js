import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import Lock from '@material-ui/icons/Lock'
import Train from '@material-ui/icons/Train'
import Public from '@material-ui/icons/Public'
import { loadAll } from 'tools/modules/location'

import GoogleMap from 'components/GoogleMap'
import { prefectures } from '@smooosy/config'

const prefs = []
prefs.push('日本')
Object.keys(prefectures).forEach(key => {
  prefs.push(key)
})

@withStyles(theme => ({
  root: {
    width: '100%',
    margin: 20,
    height: '100%',
    background: theme.palette.common.white,
  },
  header: {
    marginBottom: 20,
  },
  input: {
    width: 200,
    marginBottom: 20,
  },
  marginLeft: {
    marginLeft: 20,
  },
  map: {
    width: '80%',
    height: 300,
  },
}))
class AreaMap extends React.Component {

  constructor (props) {
    super(props)
    this.markerRef = {}
  }

  componentWillUnmount() {
    this.markerRef = {}
  }

  onClickMarker = (id) => {
    const {history} = this.props
    history.push(`/locations/${id}`)
  }

  onMouseOverMarker = (id) => {
    const {locations} = this.props

    if (this.markerRef[id]) {
      const l = locations.filter(l => l.id === id)
      const el = this.markerRef[id].parentNode
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
    if (this.markerRef[id]) {
      const msg = document.querySelector(`#msg_${id}`)
      if (msg) {
        msg.parentNode.removeChild(msg)
      }
    }
  }

  render() {
    const {locations = [], classes} = this.props

    return (
      <div className={classes.root}>
        <h4 className={classes.header}>地域の分布</h4>
        <div className={classes.map}>
          <GoogleMap
            markers={locations.map(l => ({
              id: l.id,
              lat: l.loc ? l.loc.coordinates[1] : 35.681298,
              lng: l.loc ? l.loc.coordinates[0] : 139.7662469,
              distance: l.distance,
            }))}
            onClickMarker={this.onClickMarker}
            onMouseOverMarker={this.onMouseOverMarker}
            onMouseOutMarker={this.onMouseOutMarker}
            markerRef={(el) => {
              if (el && el.hasAttributes()) {
                el.style.cursor = 'default'
                this.markerRef[el.getAttribute('data-id')] = el
              }
            }}
          />
        </div>
      </div>
    )
  }
}

@connect(
  state => ({
    locations: state.location.locations,
  }),
  { loadAll }
)
@withStyles({
  prefecture: {
    margin: 20,
  },
  content: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  link: {
    marginRight: 20,
  },
  train: {
    width: 15,
    height: 15,
    color: 'grey',
  },
  lock: {
    width: 15,
    height: 15,
    color: 'grey',
  },
  public: {
    width: 15,
    height: 15,
    color: 'blue',
  },
})
@withRouter
export default class LocationList extends React.Component {

  constructor (props) {
    super(props)
    this.state = { showType: '市区町村', keyPath: 'japan' }
  }

  componentDidMount () {
    const { keyPath } = this.state
    this.props.loadAll({keyPath})
  }

  onSelectPrefecture = (keyPath) => {
    this.props.loadAll({keyPath})
      .then(() => this.setState({keyPath}))
  }

  render () {
    const { locations, history, classes } = this.props
    const { showType, keyPath } = this.state

    return (
      <div>
        <div className={classes.prefecture}>
        {
          Object.keys(prefectures).map(key =>
            <a key={key} className={classes.link} onClick={() => this.onSelectPrefecture(prefectures[key])}>{key}</a>
          )
        }
        </div>
        {
          keyPath !== 'japan' &&
          locations.filter(l => l.parentKey === 'japan').map(p => (
              <div key={p.key} className={classes.prefecture}>
                <details open>
                  <summary>
                    {p.name}
                    <select  style={{marginLeft: 20}} value={showType} onChange={(e) => this.setState({ showType: e.target.value })} >
                      <option value='市区町村'>市区町村</option>
                      <option value='駅'>駅</option>
                      <option value='統合地域'>統合地域</option>
                    </select>
                  </summary>
                  <dl className={classes.content}>
                    {
                      locations.filter(l => showType === '駅' ? l.isStation : showType === '統合地域' ? (l.group && l.group.length > 0) : !l.isStation && (!l.group || l.group.length === 0)).map(l => {
                        const NG = (l.loc.coordinates[1].toFixed(7) ===  35.6811673.toFixed(7) && l.loc.coordinates[0].toFixed(7) === 139.7648575.toFixed(7)) ? <span>(NG)</span> : null
                        return <dt key={l.id} className={classes.link}><Link key={l.id} to={showType === '統合地域' ? `/locationGroups/${l.id}` : `/locations/${l.id}`}>{l.name}</Link>{ (l.parentKey === 'japan' || l.code) ? l.isStation ? <Train className={classes.train} /> : <Lock className={classes.lock} /> : null}{l.isPublished && <Public className={classes.public}/>}{NG}</dt>
                      })
                    }
                  </dl>
                </details>
              </div>
            )
          )
        }
        {<AreaMap history={history} locations={keyPath === 'japan' ? locations : locations.filter(l => showType === '駅' ? l.isStation : showType === '統合地域' ? (l.group && l.group.length > 0) : (!l.isStation && (!l.group || l.group.length === 0) && l.parentKey !== 'japan'))} />}
      </div>
    )
  }

}
