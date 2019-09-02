import React from 'react'
import { Select, MenuItem } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import renderTextInput from 'components/form/renderTextInput'
import GoogleMap from 'components/GoogleMap'
import GoogleMapStatic from 'components/GoogleMapStatic'
import { fixLongitude, geocode, parseGeocodeResults } from 'lib/geocode'

const TextInput = renderTextInput
const INVALID_ADDRESS = { valid: false, text: '日本の住所を取得できません' }

@withWidth()
@withTheme
export default class GoogleMapEdit extends React.Component {
  static defaultProps = {
    onChange: () => {},
    mapHeight: 250,
    isStatic: false,
    disabled: false,
  }

  constructor(props) {
    super(props)

    const { loc, distance, address } = props

    const center = loc ? {
      lng: loc.coordinates[0],
      lat: loc.coordinates[1],
    } : null

    this.state = {
      search: '',
      center,
      distance,
      address: {
        valid: !!loc,
        text: loc && address ? address : '',
      },
    }
  }

  componentDidMount() {
    if (this.props.initial) {
      this.search.value = this.props.initial
      if (!this.state.center) {
        this.goToSearchLocation({target: {value: this.props.initial}})
      }
    }
  }

  onMapChange = ({center, size}) => {
    const prevSize = this.state.size || {}

    if (size.width === prevSize.width && size.height === prevSize.height) {
      this.setState({center})
    }
    this.getAddress()
    this.setState({size})
  }

  // 検索窓で場所を検索
  goToSearchLocation = (e) => {
    const text = e.target.value

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.timer = setTimeout(() => {
      if (!text) return

      const address = {valid: true, text: '検索中...'}
      this.setState({address, search: text})

      geocode({address: text}).then(results => {
        const center = results[0].geometry.location
        this.setState({center})
        if (this.props.isStatic) {
          this.getAddress()
        }
      }).catch(() => {
        this.setState({address: INVALID_ADDRESS})
        this.props.onChange()
      })
    }, 1000)
  }

  // 場所から住所を取得
  getAddress = () => {
    const { center } = this.state

    geocode(center).then(results => {
      this.calcAddress(results)
    }).catch(() => {
      this.setState({address: INVALID_ADDRESS})
      this.props.onChange()
    })
  }

  calcAddress = (results) => {
    const { center, search } = this.state

    if (!center) {
      this.setState({address: INVALID_ADDRESS})
      this.props.onChange()
      return
    }

    let parts
    try {
      parts = parseGeocodeResults(results)
    } catch (e) {
      this.setState({address: INVALID_ADDRESS})
      this.props.onChange()
      return
    }
    const { zipcode, prefecture, city, town } = parts

    const address = {
      valid: true,
      text: [prefecture, city, town].join(''),
    }
    const loc = {
      type: 'Point',
      coordinates: [
        fixLongitude(center.lng),
        center.lat,
      ],
    }
    this.setState({address})

    this.props.onChange({loc, zipcode, address: address.text, prefecture, city, search})
  }

  handleDistance = (e) => {
    this.setState({distance: e.target.value})
    this.props.onDistanceChange && this.props.onDistanceChange(e.target.value)
  }

  render() {
    const { center, distance, address } = this.state
    const { style, mapHeight, width, theme, className, isStatic, zoom, disabled } = this.props

    const { grey, red } = theme.palette

    const styles = {
      root: {
        ...style,
      },
      icon: {
        height: 40,
        minWidth: 50,
      },
      address: {
        marginBottom: 10,
        fontSize: 18,
        color: address.valid ? grey[900] : red[500],
      },
      map: {
        width: '100%',
        height: mapHeight,
        pointerEvents: isStatic ? 'none' : 'auto',
      },
      static: {
        width: '100%',
        objectFit: 'cover',
        height: 200,
      },
    }

    return (
      <div style={styles.root} className={className}>
        {!disabled &&
        <div style={{display: 'flex'}}>
          <TextInput
            classes={{input: 'googleMapInput'}}
            inputRef={(e) => this.search = e}
            style={{flex: 1}}
            label={`郵便番号・住所・駅名など${width === 'xs' ? '' : 'を入力'}`}
            placeholder='103-0028 / 港区赤坂 / 新宿駅 ...'
            onChange={this.goToSearchLocation}
            meta={{}}
          />
        </div>}
        {distance &&
          <div>
            <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>依頼を受け取る距離</div>
            <Select
              disabled={disabled}
              style={{width: '100%'}}
              value={distance}
              onChange={this.handleDistance}
            >
              {[10, 20, 30, 40, 50, 70, 100, 150, 200, 300].map(km =>
                <MenuItem key={km} value={km * 1000}>{`${km}km`}</MenuItem>
              )}
            </Select>
          </div>
        }
        <div className='address' style={styles.address}>{address.valid ? `「${address.text}」周辺` : address.text}</div>
        {center &&
          <div style={styles.map}>
            {isStatic ?
              <GoogleMapStatic width={550} height={200} center={center} zoom={zoom || 14} style={styles.static} />
            :
              <GoogleMap center={center} zoom={zoom || 14} markers={[{...center, distance, icon: 'edit'}]} onChange={this.onMapChange} draggable={!disabled} />
            }
          </div>
        }
      </div>
    )
  }
}
