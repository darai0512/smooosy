import React from 'react'
import GoogleMap from 'google-map-react'
import { fitBounds, meters2ScreenPixels } from 'google-map-react/utils'

const apikey = 'AIzaSyBwFm0d0j3Nd4Jx1yWAUFYLisLAWFoqk-Q'

const DEFAULT_ZOOM = 1
const ua = window.navigator.userAgent.toLowerCase()
const notIE = ua.indexOf('msie') === -1 && ua.indexOf('trident') === -1

export default class StaticMap extends React.Component {
  static defaultProps = {
    markers: [],
    center: {lat: 35.681298, lng: 139.7662469},
    zoom: DEFAULT_ZOOM,
    onChange: () => {},
    urlKeys: {},
    onClickMarker: () => {},
    onMouseOverMarker: () => {},
    onMouseOutMarker: () => {},
    draggable: true,
  }

  constructor(props) {
    super(props)
    this.container = null
    this.state = {
      center: props.center,
      zoom: props.zoom,
      mapZoom: props.zoom,
    }
  }

  componentDidMount() {
    this.fitBoundsWithMarkers(this.props)
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.markers !== prevProps.markers ||
      this.props.center !== prevProps.center ||
      this.props.zoom !== prevProps.zoom ||
      this.props.keepCenter !== prevProps.keepCenter
    ) {
      this.fitBoundsWithMarkers(this.props)
    }
  }

  fitBoundsWithMarkers(props) {
    const { markers, center, zoom, keepCenter } = props

    if (markers.length < 2) {
      this.setState({
        center: center || this.state.center,
        zoom: zoom || this.state.zoom,
      })
      return
    }

    const latList = [], lngList = []
    for (let marker of markers) {
      latList.push(marker.lat)
      lngList.push(marker.lng)
    }
    const bounds = {
      nw: {
        lat: Math.max(...latList),
        lng: Math.min(...lngList),
      },
      se: {
        lat: Math.min(...latList),
        lng: Math.max(...lngList),
      },
    }

    if (bounds.nw.lat === bounds.se.lat || bounds.nw.lng === bounds.se.lng) {
      this.setState({
        center: center || this.state.center,
        zoom: 12,
      })
      return
    }


    const rect = this.container.getBoundingClientRect()
    const size = {
      width: Math.max(1, keepCenter ? rect.width * 0.6 - 50 : rect.width - 50),
      height: Math.max(1, keepCenter ? rect.height * 0.6 - 50 : rect.height - 50),
    }
    const fit = fitBounds(bounds, size)
    this.setState({
      center: keepCenter ? center : fit.center,
      zoom: fit.zoom,
    })
  }

  onChange = (info) => {
    this.setState({mapZoom: info.zoom})
    if (this.timer) return
    this.timer = setTimeout(() => {
      clearTimeout(this.timer)
      this.timer = null
      this.props.onChange(info)
    }, 100)
  }

  render() {
    const { center, zoom, mapZoom } = this.state
    const { markers, onLoad, urlKeys, onClickMarker, onMouseOverMarker, onMouseOutMarker, markerRef, draggable } = this.props

    const styles = {
      root: {
        width: '100%',
        height: '100%',
      },
    }

    const iconList = {
      red: {
        url: '//maps.google.com/mapfiles/ms/icons/red-dot.png',
        width: 32,
        height: 32,
        bottom: 0,
        alt: '赤ピン',
      },
      green: {
        url: '//maps.google.com/mapfiles/ms/icons/green-dot.png',
        width: 32,
        height: 32,
        bottom: 0,
        alt: '緑ピン',
      },
      edit: {
        url: '/images/red-dot-edit.png',
        width: 32,
        height: 50,
        bottom: 11,
        alt: '赤ピン目的地',
      },
    }

    return (
      <div ref={(e) => this.container = e} style={styles.root}>
        <GoogleMap
          draggable={draggable}
          options={{scrollwheel: false, disableDefaultUI: false}}
          resetBoundsOnResize={notIE}
          bootstrapURLKeys={{key: apikey, language: 'ja', ...urlKeys}}
          center={center}
          zoom={zoom}
          defaultZoom={DEFAULT_ZOOM}
          onChange={this.onChange}
          onChildClick={this.props.onChildClick}
          yesIWantToUseGoogleMapApiInternals={!!onLoad}
          onGoogleApiLoaded={onLoad}
        >
          {(markers || []).map(({id, lat, lng, icon, distance, ...custom}, i) => (
            distance ?
            <Circle key={i} id={id} lat={lat} lng={lng} icon={iconList[icon || 'red']} onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} distance={distance} zoom={mapZoom} />
            :
            <Marker key={i} id={id} lat={lat} lng={lng} icon={iconList[icon || 'red']} onClickMarker={onClickMarker} onMouseOverMarker={onMouseOverMarker} onMouseOutMarker={onMouseOutMarker} markerRef={markerRef} {...custom} />
          ))}
        </GoogleMap>
      </div>
    )
  }
}

const Circle = ({id, lat, lng, icon, onClickMarker, onMouseOverMarker, onMouseOutMarker, markerRef, distance, zoom}) => {
  const { w, h } = meters2ScreenPixels(distance, { lat, lng }, zoom)
  return (
    <div>
      <div style={{position: 'absolute', width: 2*w, height: 2*h, top: -h, left: -w, borderRadius: w, background: 'rgba(143, 195, 32, .3)', border: '2px solid rgb(143, 195, 32)'}} />
      <div style={{position: 'absolute', width: icon.width, heigth: icon.height, top: icon.bottom - icon.height, left: - icon.width / 2, zIndex: 1000000}}>
        <img alt={icon.alt} src={icon.url} style={{width: '100%', height: '100%'}} onClick={() => onClickMarker(id)} onMouseOver={() => onMouseOverMarker(id)} onMouseOut={() => onMouseOutMarker(id)} ref={markerRef} data-id={id} />
      </div>
    </div>
  )
}

const Marker = ({id, icon, onClickMarker, onMouseOverMarker, onMouseOutMarker,  markerRef}) => (
  <div style={{position: 'absolute', width: icon.width, height: icon.height, top: icon.bottom - icon.height, left: - icon.width / 2, zIndex: 1000000}}>
    <img src={icon.url} style={{width: '100%', height: '100%'}} onClick={() => onClickMarker(id)} onMouseOver={() => onMouseOverMarker(id)} onMouseOut={() => onMouseOutMarker(id)} ref={markerRef} data-id={id} />
  </div>
)
