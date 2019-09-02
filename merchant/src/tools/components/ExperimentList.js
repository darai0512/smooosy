import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'
import EnhancedTable from 'components/EnhancedTable'
import { loadAll, remove } from 'tools/modules/experiment'

@withTheme
@connect(
  // propsに受け取るreducerのstate
  state => ({
    experiments: state.experiment.experiments,
  }),
  // propsに付与するactions
  { loadAll, remove }
)
export default class ExperimentList extends React.Component {

  componentDidMount () {
    this.props.loadAll()
  }

  remove = (ids) => {
    this.props.remove(ids)
    .then(() => this.props.loadAll())
  }

  edit = (id) => {
    this.props.history.push(`/experiments/${id}`)
  }

  render () {
    const { theme, experiments } = this.props
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
        render: row => row.name,
      },
      {
        id: 'startAt',
        label: '開始日',
        sort: row => row.startAt,
        render: row => moment(row.startAt).format('YYYY/MM/DD HH:mm'),
      },
      {
        id: 'endAt',
        label: '終了日',
        sort: row => row.endAt,
        render: row => moment(row.endAt).format('YYYY/MM/DD HH:mm'),
      },
      {
        id: 'isActive',
        label: 'アクティブ',
        sort: row => row.isActive,
        render: row => row.isActive ? 'true' : 'false',
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
        onClick: this.remove,
        reset: true,
      },
    ]

    return <EnhancedTable
        title='ABテスト'
        columns={columns}
        data={experiments}
        actions={actions}
        style={styles.table}
        rowsPerPageOptions={[50, 100, 200]}
        header={
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button size='small' color='primary' variant='contained' onClick={() => this.props.history.push('/experiments/new')}>新規</Button>
          </div>
        }
      />

  }
}
