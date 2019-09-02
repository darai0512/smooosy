import React from 'react'
import { Field } from 'redux-form'
import { Select, MenuItem, Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import MapsNearMe from '@material-ui/icons/NearMe'
import withWidth from '@material-ui/core/withWidth'
import renderTextInput from 'components/form/renderTextInput'
import GoogleMap from 'google-map-react'
import { meters2ScreenPixels } from 'google-map-react/utils'


@withWidth()
@withTheme
export default class LocationMap extends React.Component {

  static defaultProps = {
    onClickMarker: () => {},
    onMouseOverMarker: () => {},
    onMouseOutMarker: () => {},
  }

  constructor(props) {
    super(props)
    this.state = Object.assign({
      lat: 35.6811673,
      lng: 139.7648575,
      showMap: false,
      distance: 10000,
      zoom: 12,
      valid: false,
      marker: null,
      circle: null,
      geocoder: null,
      timer: null,
    }, props.mapinfo)
  }

  onMapLoad = ({map, maps}) => {
    const { groupMarkers } = this.props
    const {lat, lng, distance} = this.state
    const geocoder = this.state.geocoder === null ? new maps.Geocoder() : this.state.geocoder


    map.setOptions({styles: [
      {
        featureType: 'administrative.province',
        elementType: 'geometry.stroke',
        stylers: [
          {color: '#6a4cc1'},
          {visibility: 'on'},
          {weight: 2},
        ],
      },
    ]})
    if (groupMarkers.length > 0) {
      const circle = new maps.Circle({
        map: map,
        center: {lat, lng},
        radius: distance,
        strokeColor: '#006672',
        fillColor: '#0066a0',
      })
      this.setState({geocoder, circle})
    } else {
      const marker = new maps.Marker({
        map: map,
        position: {lat, lng},
      })
      const circle = new maps.Circle({
        map: map,
        center: {lat, lng},
        radius: distance,
        strokeColor: '#00903b',
        fillColor: '#8dc21f',
      })
      map.fitBounds(circle.getBounds())
      this.setState({geocoder, circle, marker})
    }
  }


  componentDidUpdate(prevProps) {
    const {marker, circle} = this.state
    const { mapinfo: { lat, lng, distance } } = this.props
    if (this.props.id !== prevProps.id) {
      if (marker) {
        marker.setPosition({ lat, lng })
      }
      if (circle) {
        circle.setCenter({ lat, lng })
        circle.setRadius(distance)
        const map = circle.getMap()
        map.fitBounds(circle.getBounds())
      }
      this.setState({
        lat,
        lng,
        distance,
      })
    }
  }


  // 現在地取得
  searchLocation = () => {
    if (navigator.geolocation) {
      this.setState({
        valid: true,
        address: '現在地取得中...',
      })
      navigator.geolocation.getCurrentPosition(pos => {
        this.setState({
          showMap: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        this.getAddress()
      }, () => this.setState({address: '現在地の取得に失敗しました'}))
    }
  }

  // 検索窓で場所を検索
  handleSearch = (e, text) => {
    const {geocoder, timer} = this.state
    if (!geocoder) return

    if (timer) {
      clearTimeout(timer)
    }
    const newTimer = setTimeout(() => {
      this.setState({
        valid: true,
        address: '検索中...',
      })
      geocoder.geocode({address: text}, (results, status) => {
        if (status == 'OK') {
          const pos = results[0].geometry.location
          this.setState({
            showMap: true,
            lat: pos.lat(),
            lng: pos.lng(),
          })
          this.getAddress()
        }
      })
    }, 1000)
    this.setState({timer: newTimer})
  }

  // 場所から住所を取得
  getAddress = () => {
    const {geocoder} = this.state
    if (!geocoder) return

    geocoder.geocode({location: this.state}, (results, status) => {
      if (status === 'OK') {
        const addressList = results[0].address_components.reverse()
        let countryIndex = null
        addressList.map((a, i) => {
          if (a.short_name === 'JP' && a.types.indexOf('country') !== -1) {
            countryIndex = i
          }
        })
        let address, valid
        if (countryIndex !== null) {
          address = `「${addressList.slice(countryIndex+1, countryIndex+4).map(a => a.long_name).join('')}」周辺`
          valid = true
        } else {
          address = '日本以外が指定されています'
          valid = false
        }
        this.setState({address, valid})
      }
    })
  }

  // 半径を変更
  handleDistance = (e) => {
    const {circle} = this.state
    const distance = e.target.value
    this.setState({distance})
    if (circle) {
      circle.setRadius(distance)
      const map = circle.getMap()
      map.fitBounds(circle.getBounds())
    }
  }

  onMapChange = ({center, zoom}) => {
    const {marker, circle} = this.state
    this.setState({
      lat: center.lat,
      lng: center.lng,
      zoom: zoom,
    })
    if (marker) marker.setPosition(center)
    if (circle) circle.setCenter(center)
    this.getAddress()
    setTimeout(() => {
      const state = this.state
      // lng should be between -180..180
      if (state.lng <= -180) {
        state.lng += 360
      }
      this.props.onMapChange(state)
    }, 1000)
  }

  render() {
    const { autoFocus, width, theme, markers, groupMarkers, onClickMarker, onMouseOverMarker, onMouseOutMarker, markerRef } = this.props
    const { showMap, lat, lng, distance, zoom, address, valid } = this.state

    const { common, grey, red } = theme.palette

    const styles = {
      root: {
        background: common.white,
        marginTop: 20,
      },
      fields: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
      input: {
        flex: 1,
      },
      map: {
        width: '100%',
        height: 250,
      },
      icon: {
        height: 40,
        minWidth: 50,
      },
    }

    const iconList = {
      red: {
        url: '//maps.google.com/mapfiles/ms/icons/red-dot.png',
        width: 24,
        height: 24,
        bottom: 0,
        alt: '赤ピン',
      },
      blue: {
        url: '//maps.google.com/mapfiles/ms/icons/blue-dot.png',
        width: 24,
        height: 24,
        bottom: 0,
        alt: '青ピン',
      },
      orange: {
        url: '//maps.google.com/mapfiles/ms/icons/orange-dot.png',
        width: 20,
        height: 20,
        bottom: 0,
        alt: 'オレンジピン',
      },
    }

    return (
      <div style={styles.root}>
        <div style={styles.fields}>
          <div style={{...styles.input, display: 'flex'}}>
            <Field
              autoFocus={autoFocus}
              name='search'
              style={{flex: 1}}
              component={renderTextInput}
              label={width === 'xs' ? '郵便番号・住所・駅名' : '郵便番号・住所・駅名などを入力'}
              placeholder='103-0028 / 港区赤坂 / 新宿駅 ...'
              type='text'
              onChange={this.handleSearch}
            />
            <div style={{marginLeft: 10}}>
              <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>現在地</div>
              <Button
                variant='contained'
                style={styles.icon}
                onClick={this.searchLocation}
              >
                <MapsNearMe />
              </Button>
            </div>
          </div>
          <div style={styles.input}>
            <div>
              <div style={{fontSize: 13, fontWeight: 'bold', color: '#666'}}>距離</div>
              <Select
                style={{width: '100%'}}
                value={distance}
                onChange={this.handleDistance}
              >
                <MenuItem value={1000}>1km</MenuItem>
                <MenuItem value={2000}>2km</MenuItem>
                <MenuItem value={3000}>3km</MenuItem>
                <MenuItem value={4000}>4km</MenuItem>
                <MenuItem value={5000}>5km</MenuItem>
                <MenuItem value={10000}>10km</MenuItem>
                <MenuItem value={20000}>20km</MenuItem>
                <MenuItem value={30000}>30km</MenuItem>
                <MenuItem value={40000}>40km</MenuItem>
                <MenuItem value={50000}>50km</MenuItem>
                <MenuItem value={60000}>60km</MenuItem>
                <MenuItem value={70000}>70km</MenuItem>
                <MenuItem value={80000}>80km</MenuItem>
                <MenuItem value={90000}>90km</MenuItem>
                <MenuItem value={100000}>100km</MenuItem>
                <MenuItem value={120000}>120km</MenuItem>
                <MenuItem value={150000}>150km</MenuItem>
                <MenuItem value={200000}>200km</MenuItem>
                <MenuItem value={300000}>300km</MenuItem>
                <MenuItem value={500000}>500km</MenuItem>
              </Select>
            </div>
          </div>
        </div>
        <div style={{fontSize: 18, color: lat && !valid ? red[500] : grey[900]}}>{address}</div>
        {showMap ?
        <div style={{position: 'relative', margin: '10px 0'}}>
          <GoogleMap
            style={styles.map}
            options={{scrollwheel: false}}
            bootstrapURLKeys={{key: 'AIzaSyBwFm0d0j3Nd4Jx1yWAUFYLisLAWFoqk-Q'}}
            center={{lat, lng}}
            zoom={zoom}
            yesIWantToUseGoogleMapApiInternals={true}
            onChange={this.onMapChange}
            onGoogleApiLoaded={this.onMapLoad}
          >
            {
              (markers || []).map(({id, type, lat, lng, icon, distance, ...custom}, i) => (
                distance ?
                <Circle key={i} id={id} type={type} lat={lat} lng={lng} icon={iconList[icon || 'blue']} background='rgba(0, 0, 0, 0)' border='1px solid rgb(24, 150, 215, .3)' onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} distance={distance} zoom={zoom} />
                :
                <Marker key={i} id={id} type={type} lat={lat} lng={lng} icon={iconList[icon || 'orange']} onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} {...custom} />
              ))
              .concat((groupMarkers || []).map(({id, type, lat, lng, icon, distance}, i) =>
                <Circle key={markers.length + i} id={`groupMakers_${id}`} type={type} lat={lat} lng={lng} icon={iconList[icon || 'red']} background='rgba(141, 194, 31, 0.3)' border='3px solid rgb(0, 144, 59, 1)' onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} distance={distance} zoom={zoom} />
              ))
            }
          </GoogleMap>
        </div>
        :
        <GoogleMap
          center={{lat: 35.681298, lng: 139.7662469}}
          zoom={12}
          bootstrapURLKeys={{key: 'AIzaSyBwFm0d0j3Nd4Jx1yWAUFYLisLAWFoqk-Q'}}
          yesIWantToUseGoogleMapApiInternals={true}
          onGoogleApiLoaded={({maps}) => {
            const geocoder = new maps.Geocoder()
            this.setState({geocoder})
          }}
        >
            {
              (markers || []).map(({id, type, lat, lng, icon, distance, ...custom}, i) => (
                distance ?
                <Circle key={i} id={id} type={type} lat={lat} lng={lng} icon={iconList[icon || 'blue']} background='rgba(0, 0, 0, 0)' border='1px solid rgb(24, 150, 215, .3)' onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} distance={distance} zoom={zoom} />
                :
                <Marker key={i} id={id} type={type} lat={lat} lng={lng} icon={iconList[icon || 'green']} onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} {...custom} />
              ))
              .concat((groupMarkers || []).map(({id, type, lat, lng, icon, distance}, i) =>
                <Circle key={markers.length + i} id={`groupMakers_${id}`} type={type} lat={lat} lng={lng} icon={iconList[icon || 'red']} background='rgba(141, 194, 31, 0.3)' border='3px solid rgb(0, 144, 59, 1)' onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} distance={distance} zoom={zoom} />
              ))
            }
        </GoogleMap>}
      </div>
    )
  }
}


const Circle = ({id, type, lat, lng, icon, background, border, onClickMarker, onMouseOverMarker, onMouseOutMarker, markerRef, distance, zoom}) => {
  const { w, h } = meters2ScreenPixels(distance, { lat, lng }, zoom)
  return (
    <div>
      <div style={{position: 'absolute', width: 2*w, height: 2*h, top: -h, left: -w, borderRadius: w, background, border}} />
      <div style={{position: 'absolute', width: icon.width, heigth: icon.height, top: icon.bottom - icon.height, left: - icon.width / 2, zIndex: 1000000}}>
        <img alt={icon.alt} src={icon.url} style={{width: '100%', height: '100%'}} onClick={() => onClickMarker(id, type)} onMouseOver={() => onMouseOverMarker(id, type)} onMouseOut={() => onMouseOutMarker(id, type)} ref={markerRef} data-id={id} data-type={type} />
      </div>
    </div>
  )
}


const Marker = ({id, type, icon, onClickMarker, onMouseOverMarker, onMouseOutMarker,  markerRef}) => (
  <div style={{position: 'absolute', width: icon.width, height: icon.height, top: icon.bottom - icon.height, left: - icon.width / 2, zIndex: 1000000}}>
    <img src={icon.url} style={{width: '100%', height: '100%'}} onClick={() => onClickMarker(id, type)} onMouseOver={() => onMouseOverMarker(id, type)} onMouseOut={() => onMouseOutMarker(id, type)} ref={markerRef} data-id={id} data-type={type} />
  </div>
)
