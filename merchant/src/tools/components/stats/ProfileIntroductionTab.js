import React from 'react'
import { connect } from 'react-redux'
import { FormControl, Select, MenuItem, Button, ListSubheader } from '@material-ui/core'

import { load as loadProfileIntroduction } from 'tools/modules/profileIntroduction'
import ProIntroduction from 'components/ProIntroduction'
import ProfileIntroductionEdit from 'tools/components/stats/ProfileIntroductionEdit'

@connect(
  state => ({
    profileIntroductions: state.profileIntroduction.profileIntroductions,
  }),
  { loadProfileIntroduction }
)
export default class ProfileIntroductionTab extends React.Component {
  constructor(props) {
    super(props)
    const { _id, services } = this.props.profile
    this.props.loadProfileIntroduction(_id)
    this.state = {
      currentTarget: services.length > 0 ? {_id: services[0]._id, reference: 'Service'} : {},
    }
  }

  setCurrentTarget = (id) => {
    const { services, categories } = this.props.profile
    let currentTarget = {}
    const category = categories.find(c => c._id === id)
    if (category) {
      currentTarget = {
        ...category,
        reference: 'Category',
      }
    } else {
      currentTarget = {
        ...services.find(s => s._id === id),
        reference: 'Service',
      }
    }
    this.setState({currentTarget})
  }

  render() {
    const { profile, profileIntroductions } = this.props
    const { currentTarget } = this.state

    const introduction = profileIntroductions.find(i => i.target === currentTarget._id)
    if (introduction) {
      introduction.profile = profile
    }
    return (
      <div style={{padding: 20}}>
        {this.state.editing ?
          <ProfileIntroductionEdit
            profile={profile}
            introduction={introduction}
            target={currentTarget}
            onClose={() => {
              this.props.loadProfileIntroduction(profile._id)
              this.setState({editing: false})
            }}
          />
        :
          <div>
            <div style={{display: 'flex'}}>
              <FormControl>
                <Select
                  value={currentTarget._id}
                  onChange={e => this.setCurrentTarget(e.target.value)}
                  style={{minWidth: 200}}
                  inputProps={{
                    id: 'profileIntroduction',
                  }}
                >
                  <ListSubheader>カテゴリ</ListSubheader>
                  {profile.categories.map(c =>
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  )}
                  <ListSubheader>サービス</ListSubheader>
                  {profile.services.map(s =>
                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                  )}
                </Select>
              </FormControl>
              <div style={{flex: 1}} />
              {currentTarget._id &&
                <div>
                  <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({editing: true})}>編集する</Button>
                </div>
              }
            </div>
            {introduction &&
              <div style={{marginTop: 20}}>
                <ProIntroduction introduction={introduction} />
              </div>
            }
          </div>
        }
      </div>
    )
  }
}
