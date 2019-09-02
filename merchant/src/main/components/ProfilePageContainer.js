import React from 'react'
import ProfilePage from 'components/ProfilePage'

const ProfilePageContainer = (props) => <ProfilePage shortId={props.match.params.id} {...props} />

export default ProfilePageContainer