import React from 'react'
import { connect } from 'react-redux'
import { Tabs, Tab } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { load, create, update } from 'tools/modules/category'
import { open as openSnack } from 'tools/modules/snack'
import Loading from 'components/Loading'
import { CategoryBasicForm, CategorySeoForm, PageInformationForm } from 'tools/components/CategoryForm'

@withApiClient
@withTheme
@connect(
  state => ({
    category: state.category.category,
    admin: state.auth.admin,
  }),
  { load, create, update, openSnack }
)
export default class CategoryDetail extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      tab: 'top',
    }
  }

  componentDidMount() {
    this.load()
  }

  load = () => {
    if (this.isNew()) {
      return
    }

    this.props.load(this.props.match.params.key)
  }

  isNew = () => this.isAdmin() && this.props.match.params.key === 'new'
  isAdmin = () => this.props.admin > 9

  render() {
    const { category, theme } = this.props
    const { tab } = this.state
    const { common, grey } = theme.palette

    if (!this.isNew() && !category) {
      return <Loading />
    }

    if (this.isNew()) {
      return (
        <div style={{padding: 16, background: common.white}}>
          <h3>新しいカテゴリを追加</h3>
          <CategoryBasicForm isNew load={this.load} category={category} />
        </div>
      )
    }

    return (
      <div style={{padding: 16, background: common.white}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <div style={{fontSize: 18}}>{this.isNew() ? 'New' : category.name}</div>
          </div>
        </div>
        <Tabs
          variant='scrollable'
          scrollButtons='off'
          value={tab}
          onChange={(e, tab) => this.setState({tab})}
          style={{borderBottom: `1px solid ${grey[300]}`}}
        >
          <Tab value='top' label='基本情報' />
          <Tab value='seo' label='SEO設定' />
          <Tab value='cp' label='CPコンテンツ' />
        </Tabs>
        {tab === 'top' ?
          <CategoryBasicForm initialValues={category} load={this.load} category={category} />
        : tab === 'seo' ?
          <CategorySeoForm initialValues={category} load={this.load} category={category} />
        : tab === 'cp' ?
          <PageInformationForm initialValues={category} load={this.load} category={category} />
        : null}
      </div>
    )
  }
}
