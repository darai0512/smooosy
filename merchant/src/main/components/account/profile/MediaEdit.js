import React from 'react'
import { connect } from 'react-redux'
import { update as updateProfile } from 'modules/profile'
import { loadMediaList, upsertMediaList, loadAll as loadMedia, update as updateMedia, create as createMedia } from 'modules/media'
import MediaListEdit from 'components/MediaListEdit'

@connect(
  state => ({
    mediaLists: state.media.mediaLists,
    media: state.media.media,
  }),
  { updateProfile, loadMediaList, upsertMediaList, loadMedia, updateMedia, createMedia }
)
export default class MediaEdit extends React.Component {

  componentDidMount() {
    const { profile } = this.props
    this.props.loadMediaList({profile: profile.id})
    this.props.loadMedia()
  }

  render() {
    const { profile, mediaLists, media } = this.props

    if (!profile || !mediaLists) return null

    const mediaHash = {}
    profile.services.map(s => {
      mediaHash[s.id] = mediaLists.find(m => m.service.id === s.id) || {id: 'new', service: s, media: []}
    })

    const styles = {
      root: {
        padding: '20px 0',
      },
    }

    return (
      <div style={styles.root}>
        <MediaListEdit
          title='サービス共通の写真'
          mediaAll={media}
          mediaList={{id: profile.id, media: profile.media}}
          upsertList={this.props.updateProfile}
          createMedia={this.props.createMedia}
          updateMedia={this.props.updateMedia}
        />
        {profile.services.map(service =>
          <div key={`medialist_${service.id}`}>
            <MediaListEdit
              title={`「${service.name}」用の写真`}
              mediaAll={media}
              mediaList={mediaHash[service.id]}
              upsertList={this.props.upsertMediaList}
              createMedia={this.props.createMedia}
              updateMedia={this.props.updateMedia}
            />
          </div>
        )}
      </div>
    )
  }
}
