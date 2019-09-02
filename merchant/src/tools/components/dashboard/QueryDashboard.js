import React from 'react'
import { Link } from 'react-router-dom'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { connect } from 'react-redux'
import qs from 'qs'
import { Tooltip, Button, Menu, MenuItem, Switch, TextField, Drawer, IconButton, Dialog } from '@material-ui/core'
import { ListSubheader, ListItemIcon, ListItemText } from '@material-ui/core'
import { FormControlLabel } from '@material-ui/core'
import { grey, red } from '@material-ui/core/colors'
import { withTheme, withStyles } from '@material-ui/core'
import FilterListIcon from '@material-ui/icons/FilterList'
import SearchIcon from '@material-ui/icons/Search'
import FormatLineSpacingIcon from '@material-ui/icons/FormatLineSpacing'
import CloseIcon from '@material-ui/icons/Close'
import MenuIcon from '@material-ui/icons/Menu'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'

import { loadAll as loadCategories } from 'tools/modules/category'
import { loadAll as loadServices, updateQueries } from 'tools/modules/service'
import { load as loadQueries, update as updateQuery, remove as removeQuery } from 'tools/modules/query'
import { open as openSnack, close as closeSnack } from 'tools/modules/snack'
import Loading from 'components/Loading'
import { sections, imageSizes } from '@smooosy/config'

import {icons, TypeIcon} from 'tools/components/dashboard/TypeIcon'
import Card from 'tools/components/dashboard/Card'
import Column from 'tools/components/dashboard/Column'
import QueryForm from 'tools/components/dashboard/QueryForm'
import { calcPriceOptions } from 'lib/price'


const priceFactors = {
  base: '基本料金',
  discount: '割引',
  addon: '追加料金',
}

const renderCard = props => {
  const { item, count, deleteItem, styles } = props
  if (item.type === 'price') {
    item.options = calcPriceOptions(item)
  }
  return (
    <div style={styles.content}>
      <div style={{display: 'flex'}}>
        <TypeIcon type={item.type} style={styles.icon} />
        <div style={styles.summary}>{item.summary}</div>
        {deleteItem && !item.usedForPro && !item.priceFactorType &&
          <CloseIcon style={styles.close} onClick={deleteItem} />
        }
      </div>
      <div style={styles.text}>{item.text}</div>
      {item.usedForPro && item.proText && <div style={styles.proText}>{item.proText}</div>}
      {item.priceFactorType && <div style={styles.priceText}>{priceFactors[item.priceFactorType]}</div>}
      <ul style={styles.options}>
        {(item.options || []).map((option, i) =>
          option.image ?
          <li key={i} style={styles.option}>
            <img src={option.image + imageSizes.c80} style={styles.image} />
            {option.text}
          </li>
          :
          <li key={i} style={styles.option}>
            ・{option.text}
            {option.point > 0 && <span style={{fontWeight: 'bold'}}> +{option.point}pt</span>}
          </li>
        )}
      </ul>
      <div style={styles.count}>{(count || []).length}回利用</div>
    </div>
  )
}

const renderHead = ({service, items, dense}) => {
  const styles = {
    name: {
      color: service.enabled ? grey[900] : grey[600],
      textDecoration: 'underline',
      fontWeight: 'bold',
      flexShrink: 0,
      overflow: dense ?  'hidden' : 'visible',
      textOverflow: dense ? 'ellipsis' : 'clip',
      whiteSpace: dense ? 'nowrap' : 'normal',
    },
    icon: {
      width: 15,
      height: 15,
      marginLeft: 4,
      verticalAlign: 'middle',
    },
  }

  return (
    <>
      <Link key='title' style={styles.name} to={`/services/${service.id}`}>{service.name}</Link>
      <div key='info'>
        <div style={{display: 'flex', minHeight: 20}}>
          <div style={{marginRight: 5, fontWeight: 'bold'}}>質問:{items.length}</div>
          <div style={{marginRight: 5}}>類似:{(service.similarServices || []).length}</div>
          <div style={{marginRight: 5}}>おすすめ{(service.recommendServices || []).length}</div>
        </div>
        <div style={{marginBottom: 3}}>
          {Object.keys(icons).map(key => {
            const count = items.filter(q => q.type === key).length
            return (
              <span key={key}>
                <TypeIcon type={key} style={styles.icon} />
                <span style={{color: key === 'location' && count === 0 ? red[500] : grey[700]}}>{count}</span>
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}

@connect(
  state => ({
    canEdit: state.auth.admin >= 9,
    categories: state.category.categories,
    allServices: state.service.allServices,
    allQueries: state.query.queries || [],
  }),
  { loadCategories, loadServices, loadQueries, updateQueries, updateQuery, removeQuery, openSnack, closeSnack }
)
@withTheme
@withStyles(theme => ({
  drawerPaper: {
    top: 50,
    bottom: 0,
    height: 'auto',
    borderLeft: `1px solid ${theme.palette.grey[400]}`,
  },
  dialogPaper: {
    maxWidth: 'initial',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
}))
@DragDropContext(HTML5Backend)
export default class QueryDashboard extends React.Component {
  constructor(props) {
    super(props)
    const cond = qs.parse(props.location.search, {ignoreQueryPrefix: true})
    this.state = {
      // 絞り込み条件
      cond: {
        category: 'カメラマン',
        queryCategory: 'カメラマン',
        query: '',
        ...cond,
        enabled: false,
      },
      services: [],
      queries: [],
      count: {},
      source: {}, // ドラッグ元
      dest: {}, // ドラッグ先
      backup: null, // UNDOのためのバックアップ
      dense: true, // 詳細を隠す
      column: 0,
      index: 0,
    }
  }

  componentDidMount() {
    this.loadAll()
  }

  componentDidUpdate(prevProps) {
    const prevCond = qs.parse(prevProps.location.search, {ignoreQueryPrefix: true})
    const newCond = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    if (['category', 'query', 'queryCategory'].some(key => prevCond[key] !== newCond[key])) {
      this.filter(newCond)
    }
  }

  loadAll = (type) => {
    if (!type || type === 'services') {
      this.props.loadServices().then(() => {
        this.filter()
        this.countItem()
      })
    }
    if (!type || type === 'queries') {
      this.props.loadQueries().then(() => {
        this.filter()
      })
    }
    this.props.loadCategories()
  }

  countItem = () => {
    const count = {}
    for (let s of this.props.allServices) {
      for (let q of s.queries) {
        (count[q.id] || (count[q.id] = [])).push(s.name)
      }
    }
    this.setState({count})
  }

  // 絞り込み条件を元にservicesとqueriesを絞り込んで表示させる
  // 絞り込み条件の保存も行う
  filter = (newCond) => {
    const cond = {...this.state.cond, ...newCond}

    // サービス絞り込みカテゴリを変えたら質問のカテゴリも変える
    if (newCond && newCond.category) {
      cond.queryCategory = newCond.category
    }

    const skip = newCond && !('category' in newCond) && !('enabled' in newCond) && !('query' in newCond)

    const services = skip ?
      this.state.services :
      this.props.allServices.filter(s => {
        const searchTargets = [s.name, s.providerName, ...s.tags]
        const searchText = searchTargets.join()
        return (
          (cond.category === 'all' || s.tags.indexOf(cond.category) !== -1) &&
          (!cond.enabled || s.enabled) &&
          (!cond.query || cond.query.split(/[\s\u3000]/).every(e => searchText.indexOf(e) !== -1))
        )
      }).slice(0, 50)

    const queries = this.props.allQueries.filter(q =>
      (q.tags.indexOf(cond.queryCategory) !== -1 || q.tags.length === 0) &&
      (!cond.queryType || cond.queryType === q.type)
    )
    const condWithOutEnabled = {...cond}
    delete condWithOutEnabled.enabled
    this.props.history.push(`${this.props.location.pathname}?${qs.stringify(condWithOutEnabled)}`)
    this.setState({
      services,
      queries,
      cond,
      anchor: null,
      queryAnchor: null,
      typeAnchor: null,
    })
  }

  // 子componentから親のstateを変えるための関数
  setMainState = state => {
    this.setState(state)
  }

  // sourceとdestを元に更新を行う
  update = () => {
    if (!this.props.canEdit) {
      this.snack('編集権限がありません。', false)
      return
    }

    const { services, queries, source, dest, copy } = this.state
    if (Object.keys(source).length === 0 || Object.keys(dest).length === 0) return
    if (source.column === dest.column && source.index === dest.index) return

    // 追加するquery
    const target = source.column < 0 ? queries[source.index] : services[source.column].queries[source.index]

    if (source.column !== dest.column && copy) {
      this.setState({
        editItem: {
          text: target.text,
          summary: target.summary,
          type: target.type,
          tags: services[dest.column].tags[0] ? [services[dest.column].tags[0]] : [],
          options: [...target.options],
        },
        appendColumn: dest.column,
      })
      return
    }

    this.setState({
      backup: {
        index: dest.column,
        queries: [...services[dest.column].queries],
      },
    })

    // 追加されるquery配列
    const newQueries = services[dest.column].queries
    if (source.column === dest.column) {
      // 同じservice内の場合並び替え
      newQueries.splice(source.index, 1)
      newQueries.splice(dest.index, 0, target)
    } else {
      // すでに含む場合追加しない
      if (newQueries.map(q => q.id).indexOf(source.id) !== -1) return

      // 違うserviceにはコピーする
      newQueries.splice(dest.index, 0, target)

      this.countItem()
    }

    const service = services[dest.column]
    const prevQueryIds = []
    for (let query of service.queries) {
      // skip条件を取得
      const skipQueryIds = [].concat(...query.options.map(o => o.skipQueryIds || []))
      // skip対象がskip条件より前に含まれている
      for (let q of prevQueryIds) {
        if (skipQueryIds.includes(q)) {
          this.undo()
          this.snack('スキップ対象のため、スキップ条件より前に移動できません', false)
          return
        }
      }
      prevQueryIds.push(query.id)
    }
    this.props.updateQueries(service)
      .then(() => this.snack('保存しました'))
  }

  // 1つ前の状態に戻す
  undo = () => {
    const { services, backup } = this.state
    this.props.closeSnack()
    if (!backup) return

    services[backup.index].queries = backup.queries
    this.countItem()
    this.props.updateQueries(services[backup.index])
  }

  // serviceから指定のqueryを削除する
  deleteItem = (column, index) => {
    if (!this.props.canEdit) {
      this.snack('編集権限がありません。', false)
      return
    }

    const { services } = this.state

    if (!this.deleteCheck(services[column].queries[index], services[column].queries)) return

    this.setState({
      backup: {
        index: column,
        queries: [...services[column].queries],
      },
    })

    services[column].queries.splice(index, 1)
    this.countItem()
    this.props.updateQueries(services[column])
      .then(() => this.snack('保存しました'))
  }

  updateQuery = values => {
    if (!this.props.canEdit) {
      this.snack('編集権限がありません。', false)
      return
    }

    const { services, appendColumn } = this.state
    return this.props.updateQuery(values).then(query => {
      this.setState({editItem: null})
      if (values.id) {
        // update
        this.loadAll()
      } else {
        // insert
        const newQueries = services[appendColumn].queries
        newQueries.push(query)

        this.countItem()
        this.props.updateQueries(services[appendColumn]).then(() => {
          this.loadAll('queries')
        })
      }
    })
  }

  removeQuery = values => {
    if (!this.props.canEdit) {
      this.snack('編集権限がありません。', false)
      return
    }

    const { services, column } = this.state

    if (!this.deleteCheck(values, services[column].queries)) return

    this.props.removeQuery(values).then(() => {
      this.setState({editItem: null})
      this.loadAll()
    })
  }

  deleteCheck = (query, queries = []) => {
    if (query.options.skipQueryIds && query.options.skipQueryIds.length > 0) {
      this.snack('スキップ条件が設定されているため、削除できません', false)
      return false
    }

    for (let i = 0; i < queries.length; i++) {
      for (let option of queries[i].options) {
        if (option.skipQueryIds && option.skipQueryIds.includes(query.id)) {
          return this.snack('スキップ質問に指定されているため、削除できません', false)
        }
      }
    }

    return true
  }

  // 新規作成モーダルを開く
  newItem = (service, appendColumn) => {
    if (!this.props.canEdit) {
      this.snack('編集権限がありません。', false)
      return
    }

    this.setState({
      editItem: {
        type: 'singular',
        tags: service.tags[0] ? [service.tags[0]] : [],
        subType: 'none',
      },
      appendColumn,
    })
  }

  moveColumn = (from, to) => {
    const { services } = this.state
    const target = services[from]
    services.splice(from, 1)
    services.splice(to, 0, target)

    this.setState({services})
  }

  snack = (message, needUndo = true) => {
    const option = {
      duration: 8000,
      anchor: {vertical: 'bottom', horizontal: 'left'},
      action: [
        <Button key='undo' color='secondary' size='small' onClick={this.undo} style={{display: needUndo ? 'block' : 'none'}}>
          UNDO
        </Button>,
        <IconButton
          key='close'
          color='inherit'
          onClick={() => this.props.closeSnack()}
        >
          <CloseIcon />
        </IconButton>,
      ],
    }
    this.props.openSnack(message, option)
  }

  render() {
    const { canEdit, theme, categories, classes } = this.props
    const { cond, services, queries, count, source, dest, editItem, index } = this.state
    const { common, primary } = theme.palette

    if (!services) {
      return <Loading />
    }

    const styles = {
      root: {
        width: this.state.drawer ? 'calc(100% - 200px)' : '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 13,
      },
      header: {
        height: 40,
        display: 'flex',
        alignItems: 'center',
        background: grey[200],
        borderBottom: `1px solid ${grey[300]}`,
      },
      control: {
        margin: '0px 10px',
      },
      row: {
        flex: 1,
        overflowX: 'auto',
        background: grey[400],
        display: 'flex',
        alignItems: 'flex-start',
        padding: 6,
      },
      drawerColumn: {
        width: 200,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 6,
        background: grey[300],
        overflowY: 'auto',
      },
      subheader: {
        background: common.white,
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
    }

    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <Tooltip title='カテゴリ絞り込み' style={styles.control}>
            <Button size='small' onClick={e => this.setState({anchor: e.currentTarget})}>
              <FilterListIcon />
              <div>{cond.category === 'all' ? 'すべて' : cond.category}</div>
            </Button>
          </Tooltip>
          <Menu
            open={!!this.state.anchor}
            anchorEl={this.state.anchor}
            onClose={() => this.setState({anchor: null})}
          >
            <MenuItem selected={cond.category === 'all'} onClick={() => this.filter({category: 'all'})}>すべて</MenuItem>
            {sections.map(sec =>
              <div key={sec.key}>
                <ListSubheader style={styles.subheader}>{sec.name}</ListSubheader>
                {categories.filter(c => c.parent === sec.key).map(c =>
                  <MenuItem key={c.key} selected={cond.category === c.name} onClick={() => this.filter({category: c.name})}>{c.name}</MenuItem>
                )}
              </div>
            )}
          </Menu>
          <FormControlLabel
            label='公開'
            style={styles.control}
            control={<Switch color='primary' checked={cond.enabled} onChange={(e, enabled) => this.filter({enabled})} />}
          />
          <div style={{...styles.control, display: 'flex', alignItems: 'center'}}>
            <SearchIcon />
            <TextField style={{width: 200}} placeholder='検索ワード' onChange={e => this.filter({query: e.target.value})} type='search' />
          </div>
          <Tooltip title='表示切り替え' style={styles.control}>
            <IconButton onClick={() => this.setState({dense: !this.state.dense})}>
              <FormatLineSpacingIcon style={{color: this.state.dense ? grey[700] : primary.main}} />
            </IconButton>
          </Tooltip>
          <div style={{flex: 1}} />
          {!this.state.drawer &&
            <IconButton onClick={() => this.setState({drawer: true})}>
              <MenuIcon />
            </IconButton>
          }
        </div>
        <Drawer
          variant='persistent'
          anchor='right'
          open={this.state.drawer}
          classes={{paper: classes.drawerPaper}}
        >
          <div style={{height: 40, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${grey[300]}`}}>
            <IconButton onClick={() => this.setState({drawer: false})}>
              <ChevronRightIcon />
            </IconButton>
            <div style={{flex: 1}} />
            <Tooltip title='タイプ絞り込み' style={styles.control}>
              <Button size='small' onClick={e => this.setState({typeAnchor: e.currentTarget})}>
                <TypeIcon type={cond.queryType} />
                <div>{cond.queryType || '全タイプ'}</div>
              </Button>
            </Tooltip>
            <Menu
              open={!!this.state.typeAnchor}
              anchorEl={this.state.typeAnchor}
              onClose={() => this.setState({typeAnchor: null})}
            >
              <MenuItem selected={!cond.queryType} onClick={() => this.filter({queryType: null})}>
                <ListItemIcon><FilterListIcon /></ListItemIcon>
                <ListItemText primary='全タイプ' />
              </MenuItem>
              {Object.keys(icons).map(key =>
                <MenuItem key={key} selected={cond.queryType === key} onClick={() => this.filter({queryType: key})}>
                  <ListItemIcon><TypeIcon type={key} /></ListItemIcon>
                  <ListItemText primary={key} />
                </MenuItem>
              )}
            </Menu>
          </div>
          <div style={styles.drawerColumn}>
            <Tooltip title='カテゴリ絞り込み' style={{marginBottom: 6}}>
              <Button size='small' style={{minHeight: 32}} onClick={e => this.setState({queryAnchor: e.currentTarget})}>
                <FilterListIcon />
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{cond.queryCategory === 'all' ? '共通' : cond.queryCategory}</div>
              </Button>
            </Tooltip>
            <Menu
              open={!!this.state.queryAnchor}
              anchorEl={this.state.queryAnchor}
              onClose={() => this.setState({queryAnchor: null})}
            >
              <MenuItem selected={cond.queryCategory === 'all'} onClick={() => this.filter({queryCategory: 'all'})}>共通</MenuItem>
              {sections.map(sec =>
                <div key={sec.key}>
                  <ListSubheader style={styles.subheader}>{sec.name}</ListSubheader>
                  {categories.filter(c => c.parent === sec.key).map(c =>
                    <MenuItem key={c.key} selected={cond.queryCategory === c.name} onClick={() => this.filter({queryCategory: c.name})}>{c.name}</MenuItem>
                  )}
                </div>
              )}
            </Menu>
            {queries.map((q, i) =>
              <Card
                key={q.id}
                item={q}
                count={count[q.id]}
                column={-1}
                index={i}
                dense={this.state.dense}
                beginDrag={source => this.setState({source})}
                onMove={() => this.setState({dest: {}})}
                endDrag={() => this.setState({source: {}, dest: {}})}
                edit={editItem => this.setState({editItem})}
                renderCard={renderCard}
              />
            )}
          </div>
        </Drawer>
        <div style={styles.row}>
          {services.map((s, i) =>
            <Column
              key={s.id}
              target='QueryDashboard'
              service={s}
              items={s.queries || []}
              count={count}
              column={i}
              source={source}
              dest={dest}
              dense={this.state.dense}
              copy={this.state.copy}
              setMainState={this.setMainState}
              update={this.update}
              edit={(editItem, column, index) => this.setState({editItem, column, index, focusService: s})}
              deleteItem={canEdit ? this.deleteItem : null}
              newItem={canEdit ? () => this.newItem(s, i) : null}
              moveColumn={this.moveColumn}
              renderHead={renderHead}
              renderCard={renderCard}
              filter={this.filter}
            />
          )}
        </div>
        <Dialog open={!!editItem} onClose={() => this.setState({editItem: null, appendColumn: null})}>
          <QueryForm
            initialValues={editItem}
            index={index}
            services={editItem ? count[editItem.id] : null}
            onSubmit={this.updateQuery}
            onRemove={this.removeQuery}
            focusService={this.state.focusService}
          />
        </Dialog>
      </div>
    )
  }
}
