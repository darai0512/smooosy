import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogContent } from '@material-ui/core'

import { LicenceForm } from 'tools/components/LicenceEdit'
import { loadAll, create } from 'tools/modules/licence'

@connect(state => ({
  licences: state.licence.licences,
}), { loadAll, create })
@withRouter
export default class LicenceList extends React.Component {
  state = {
    open: false,
  }

  componentDidMount() {
    this.props.loadAll()
  }

  submit = values => {
    if (values.fields) {
      const fields = {}
      values.fields.forEach(f => {
        if (f.key) {
          fields[f.key] = f.value
        }
      })
      values.fields = fields
    }
    return this.props.create(values)
    .then(() => {
      this.props.loadAll()
      this.setState({open: false})
    })
  }

  render() {
    const { licences } = this.props
    if (!licences) return null

    const styles = {
      root: {
        padding: 50,
      },
    }

    return (
      <div style={styles.root}>
        <Button onClick={() => this.setState({open: true})} variant='contained' color='primary' style={{marginBottom: 20}}>新規追加</Button>
        {licences.map(l =>
          <div key={l.id}>
            <Link to={`/licences/${l.id}`}>{l.name}</Link>
          </div>
        )}
        <Dialog open={this.state.open} onClose={() => this.setState({open: false})}>
          <DialogContent>
            <LicenceForm onSubmit={this.submit} isNew />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}