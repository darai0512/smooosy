import React from 'react'
import { connect } from 'react-redux'
import { update as updateProfile } from 'modules/profile'
import { loadAll as loadAllLicences } from 'modules/licence'
import { FieldArray, reduxForm, SubmissionError } from 'redux-form'
import { Button, CircularProgress } from '@material-ui/core'
import LicenceFields from 'components/LicenceFields'


@reduxForm({
  form: 'profile',
})
@connect(
  state => ({
    licences: state.licence.licences,
  }),
  { updateProfile, loadAllLicences }
)
export default class LicenceEdit extends React.Component {
  componentDidMount() {
    const { profile, initialize, reset } = this.props
    initialize({
      licences: profile.licences.map(l => ({
        ...l,
        licence: l.licence.id,
      })),
    })
    reset() // workaround
    this.props.loadAllLicences()
  }

  submitProfile = ({licences}) => {
    const errorLicences = []
    licences = licences.filter(l => l.licence)
    licences.forEach((l, idx) => {
      const err = {}
      const licence = this.props.licences.find(ll => ll.id === l.licence)
      if (licence.needImage && !l.image) {
        err.image = '画像のアップロードが必要です'
      }
      if (licence.needText) {
        const validator = licence.validator ? eval('(' + licence.validator + ')') : (() => '')
        const error = validator(l.info)
        if (error) {
          err.info = error
        }
      }
      if (!l._id && Object.keys(err).length) errorLicences[idx] = err
    })
    if (errorLicences.length) throw new SubmissionError({licences: errorLicences})

    const id = this.props.profile.id
    return this.props.updateProfile(id, {licences}).then(() => {
      return this.props.onSubmit()
    })
  }

  render() {
    const { profile, licences, handleSubmit, submitting } = this.props

    if (!profile) {
      return null
    }

    const styles = {
      root: {
        padding: 20,
      },
    }
    const profileLicences = profile.licences.map(l => ({
      ...l,
      licence: l.licence.id,
    }))

    return (
      <form onSubmit={handleSubmit(this.submitProfile)} style={styles.root}>
        <FieldArray name='licences' component={LicenceFields} licences={licences} values={profileLicences} />
        <Button variant='contained'
          type='submit'
          disabled={submitting}
          color='primary'
          style={{width: '100%', marginTop: 20, height: 50}}
        >
          {submitting ? <CircularProgress size={20} color='secondary' /> : '更新する'}
        </Button>
      </form>
    )
  }
}
