import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core'
import { withStyles } from '@material-ui/styles'
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'
import AdminIcon from '@material-ui/icons/SupervisedUserCircle'
import EnhancedTable from 'components/EnhancedTable'

import { loadAll, remove } from 'tools/modules/runtimeConfig'
import ConfirmDialog from 'components/ConfirmDialog'

@withTheme
@connect(
  // propsに受け取るreducerのstate
  state => ({
    runtimeConfigs: state.runtimeConfig.runtimeConfigs,
  }),
  // propsに付与するactions
  { loadAll, remove }
)
@withStyles(theme => ({
  nameRow: {
    position: 'relative',
  },
  adminIcon: {
    position: 'absolute',
    top: -10,
    left: -14,
    fontSize: 18,
    color: theme.palette.red[600],
  },
}))
export default class RuntimeConfigList extends React.Component {
  state = {
    removeIds: [],
  }

  componentDidMount () {
    this.props.loadAll()
  }

  openRemoveDialog = (ids) => {
    this.setState({removeIds: ids})
  }

  remove = () => {
    const { removeIds } = this.state
    this.props.remove(removeIds)
      .then(() => {
        this.props.loadAll()
        this.setState({removeIds: []})
      })
  }

  edit = (id) => {
    this.props.history.push(`/runtimeConfigs/${id}`)
  }

  render () {
    const { theme, runtimeConfigs, classes } = this.props
    const { removeIds } = this.state
    const { common, primary, grey } = theme.palette

    const styles = {
      table: {
        height: '100%',
      },
      form: {
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
      },
      subheader: {
        background: common.white,
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
      label: {
        fontWeight: 'bold',
        fontSize: 13,
        color: grey[700],
      },
    }

    const columns = [
      {
        id: 'name',
        label: 'テスト名',
        sort: row => row.name,
        render: row => <div className={classes.nameRow}>{row.admin && <AdminIcon className={classes.adminIcon} />}{row.name}</div>,
      },
      {
        id: 'isEnabled',
        label: '有効',
        sort: row => row.isEnabled,
        render: row => row.isEnabled ? '有効' : '無効',
      },
      {
        id: 'priority',
        label: 'Priority',
        sort: row => row.priority,
        render: row => row.priority,
      },
      {
        id: 'rollout.start',
        label: 'rollout start',
        sort: row => row.rollout.start,
        render: row => row.rollout.start,
      },
      {
        id: 'rollout.end',
        label: 'rollout end',
        sort: row => row.rollout.end,
        render: row => row.rollout.end,
      },
    ]

    const actions = [
      {
        icon: EditIcon,
        onClick: this.edit,
        reset: true,
        selectOne: true,
      },
      {
        icon: DeleteIcon,
        onClick: this.openRemoveDialog,
        reset: true,
      },
    ]

    return (
      <>
        <EnhancedTable
          title='Runtime Configs'
          columns={columns}
          data={runtimeConfigs}
          actions={actions}
          style={styles.table}
          rowsPerPageOptions={[50, 100, 200]}
          header={
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <Button size='small' color='primary' variant='contained' onClick={() => this.props.history.push('/runtimeConfigs/new')}>新規</Button>
            </div>
          }
        />
        <ConfirmDialog
          open={removeIds.length}
          title={`${removeIds.length}個のruntimeConfigを削除しますか？`}
          label='削除する'
          cancelLabel='Cancel'
          onSubmit={this.remove}
          onClose={() => this.setState({removeIds: []})}
        >
          {runtimeConfigs.filter(rc => removeIds.includes(rc._id)).map(rc => <div key={rc._id}>・{rc.name}</div>)}
        </ConfirmDialog>
      </>
    )
  }
}
