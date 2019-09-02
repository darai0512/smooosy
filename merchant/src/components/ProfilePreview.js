import React from 'react'
import { Button, Menu, MenuItem, DialogTitle, DialogContent } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'

import ProfileBase from 'components/ProfileBase'

export default class ProfilePreview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      previewAnchor: null,
      previewService: props.profile.services[0],
    }
  }

  selectPreviewService = s => {
    this.setState({
      previewAnchor: null,
      previewService: s,
    })
  }

  render() {
    const { profile, mediaLists, ReviewComponent } = this.props
    const { previewService, previewAnchor } = this.state

    const previewMedia = []
    for (let list of mediaLists) {
      if (previewService && list.service.id === previewService.id) {
        previewMedia.push(...list.media)
        break
      }
    }
    const idList = previewMedia.map(m => m.id)
    previewMedia.push(...profile.media.filter(m => idList.indexOf(m.id) === -1))

    return [
      previewService ?
      <DialogTitle key='title' style={{padding: '16px 48px 16px 24px', borderBottom: `1px solid ${grey[300]}`}}>
        <Button size='small' onClick={e => this.setState({previewAnchor: e.currentTarget})}>
          <div>{previewService.name}</div>
          <KeyboardArrowDownIcon />
        </Button>
        <Menu
          open={!!previewAnchor}
          anchorEl={previewAnchor}
          onClose={() => this.setState({previewAnchor: null})}
        >
          {profile.services.map(s =>
            <MenuItem key={s.id} selected={previewService.name === s.name} onClick={() => this.selectPreviewService(s)}>{s.name}</MenuItem>
          )}
        </Menu>
      </DialogTitle> : null,
      <DialogContent key='content' style={{padding: 0}}>
        <ProfileBase profile={{...profile, media: previewMedia}} ReviewComponent={ReviewComponent} />
      </DialogContent>,
    ]
  }
}
