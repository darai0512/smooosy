import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { load } from 'tools/modules/proQuestion'
import { update } from 'tools/modules/proAnswer'
import { withTheme } from '@material-ui/core'
import { Button, FormControlLabel, Switch, Menu, MenuItem } from '@material-ui/core'
import FilterListIcon from '@material-ui/icons/FilterList'

import Loading from 'components/Loading'
import EnhancedTable from 'components/EnhancedTable'
import { open as openSnack } from 'tools/modules/snack'
import { prefectures } from '@smooosy/config'

@withTheme
@connect(
  state => ({
    proQuestion: state.proQuestion.proQuestion,
  }),
  { load, update, openSnack }
)
export default class ProQuestionDetail extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      prefecture: '全国',
      proAnswers: null,
      showPublished: false,
    }
  }

  componentDidMount () {
    this.load()
  }

  load = () => {
    this.props.load(this.props.match.params.id)
      .then((data) => {
        const proAnswers = {}
        for (let proanswer of data.proQuestion.proAnswers) {
          proAnswers[proanswer.id] = proanswer
        }
        this.setState({proAnswers})
      })
  }

  save = (row) => {
    const { proAnswers } = this.state
    const newRow = {
      ...proAnswers[row.id],
      profile: row.profile.id,
      isPublished: !row.isPublished,
    }
    this.props.update(row.id, newRow)
      .then(() => {
        this.load()
        this.props.openSnack('保存されました', {anchor: {vertical: 'bottom', horizontal: 'left'}})
      })
  }

  render () {
    const { proQuestion, theme } = this.props
    const { proAnswers, prefecture, showPublished } = this.state
    const { grey, primary } = theme.palette

    if (!proQuestion || !proAnswers) return <Loading/>

    const columns = [
      {
        id: 'name',
        label: '回答プロ',
        sort: row => row.profile.name,
        render: row => <Link to={`/stats/pros/${row.profile.id}`}>{row.profile.name}</Link>,
      },
      {
        id: 'address',
        label: '住所',
        sort: row => row.profile.address,
        render: row => row.profile.address,
      },
      {
        id: 'text',
        label: '回答',
        sort: row => row.text,
        render: row => <div style={{border: `1px dashed ${grey[500]}`, minWidth: 250, minHeight: 100, marginTop: 10, marginBottom: 10}}>{row.text}</div>,
      },
      {
        id: 'isPublished',
        label: '掲載状態',
        sort: row => row.isPublished ? 1 : -1,
        render: row => (
          <FormControlLabel
            control={
              <Switch
                checked={proAnswers[row.id].isPublished}
                onChange={() => this.save(proAnswers[row.id])}
              />
            }
            label={row.isPublished ? proQuestion.isPublished ? '掲載中' : '掲載準備中' : '非公開'}
          />
        ),
      },
    ]

    const header = (
      <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
        <span style={{marginRight: 20}}>{`掲載数(${proQuestion.proAnswers.filter(pa => pa.isPublished && prefecture === '全国' ? true : pa.profile.address.indexOf(prefecture) !== -1).length}件)`}</span>
        <FormControlLabel
          control={
            <Switch
              checked={showPublished}
              onChange={(e) => this.setState({showPublished: e.target.checked})}
            />
          }
          label='掲載中のみ表示'
        />
        <Button size='small' onClick={e => this.setState({anchor: e.currentTarget})}>
          <FilterListIcon />
          <div>{prefecture}</div>
        </Button>
        <Menu
          open={!!this.state.anchor}
          anchorEl={this.state.anchor}
          onClose={() => this.setState({anchor: null})}
        >
          {Object.keys({'全国': true, ...prefectures}).map(p =>
            <div key={p} style={{outline: 'none'}}>
              <MenuItem selected={prefecture === p} onClick={() => this.setState({prefecture: p, anchor: null})}>{p}</MenuItem>
            </div>
          )}
        </Menu>
      </div>
    )

    return (
      <EnhancedTable
        key='table'
        title={
          <div>{proQuestion.text}{proQuestion.isPublished ? <span style={{color: primary.main}}>(公開中)</span>: <span style={{color: grey[500]}}>(非公開中)</span>}</div>}
        columns={columns}
        data={proQuestion.proAnswers.filter(pa => (showPublished ? pa.isPublished : true) && prefecture === '全国' ? true : pa.profile.address.indexOf(prefecture) !== -1) || []}
        style={{height: '100%'}}
        rowsPerPageOptions={[50, 100, 200]}
        header={header}
      />
    )
  }
}
