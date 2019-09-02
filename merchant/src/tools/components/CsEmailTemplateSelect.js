import React from 'react'
import { connect } from 'react-redux'
import { Button, Table, TableBody } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { withApiClient } from 'contexts/apiClient'
import CustomRow from 'components/CustomRow'
import SimpleExpand from 'components/SimpleExpand'

import { loadCsEmailTemplates } from 'tools/modules/profile'
import { open as openSnack } from 'modules/snack'

@withApiClient
@withStyles({
  root: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  list: {
    width: '100%',
  },
})
@connect(
  state => ({
    csEmailTemplates: state.profile.csEmailTemplates,
  }),
  {loadCsEmailTemplates, openSnack}
)
export default class CsEmailTemplateSelect extends React.Component {

  componentDidMount () {
    this.load()
  }

  load = () => {
    const { profile } = this.props
    this.props.loadCsEmailTemplates(profile.id)
  }

  onRefresh = (csEmailTemplate) => {
    this.props.apiClient.post(`/api/admin/csEmailTemplates/cacheInvalidation/${csEmailTemplate.key}`)
      .then(() => {
        this.props.openSnack('キャッシュを更新しました')
        this.load()
      })
      .catch(err => {
        this.props.openSnack(`キャッシュの更新に失敗しました：${err.message || 'Unexpected Error'}`)
      })
  }

  render() {
    const { profile, csEmailTemplates, onClick, classes } = this.props

    if (!csEmailTemplates) {
      return null
    }

    return (
      <div className={classes.root}>
        <div className={classes.list}>
          {csEmailTemplates.map(csEmailTemplate =>
            <CsEmailTemplateCard
              key={csEmailTemplate.key}
              profile={profile}
              csEmailTemplate={csEmailTemplate}
              onRefresh={this.onRefresh}
              onClick={onClick}
            />
          )}
        </div>
      </div>
    )
  }
}

@withStyles(theme => ({
  header: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  table: {
    tableLayout: 'fixed',
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  footer: {
    display: 'flex',
    width: '100%',
    marginTop: 10,
  },
}))
class CsEmailTemplateCard extends React.Component {

  onClick = () => {
    this.props.onClick(this.props.csEmailTemplate)
  }

  onRefresh = () => {
    this.props.onRefresh(this.props.csEmailTemplate)
  }

  render() {
    const { csEmailTemplate, classes } = this.props

    const styles = {
      titleStyle: {
        width: 50,
        verticalAlign: 'top',
      },
    }

    return (
      <SimpleExpand
        header={
          <div className={classes.header}>
            <div>{csEmailTemplate.title}</div>
            <div style={{flex: 1}} />
            <Button variant='contained' color='primary' onClick={this.onClick} >利用する</Button>
          </div>
        }
      >
        <Table className={classes.table}>
          <TableBody>
            <CustomRow title='件名' titleStyle={styles.titleStyle}>
              <div>{csEmailTemplate.subject}</div>
            </CustomRow>
            <CustomRow title='本文' titleStyle={styles.titleStyle}>
              <div dangerouslySetInnerHTML={{__html: csEmailTemplate.html}} />
            </CustomRow>
          </TableBody>
        </Table>
        <div className={classes.footer}>
          <div style={{flex: 1}} />
          <Button variant='outlined' onClick={this.onRefresh}>キャッシュクリア</Button>
        </div>
      </SimpleExpand>
    )
  }
}
