import React from 'react'
import { DragDropContext } from 'react-dnd'
import { Link } from 'react-router-dom'
import HTML5Backend from 'react-dnd-html5-backend'
import { connect } from 'react-redux'
import {
  Tooltip, Button, Menu, MenuItem, TextField, Drawer, IconButton, Dialog,
  ListSubheader,
} from '@material-ui/core'
import { withTheme, withStyles } from '@material-ui/core/styles'
import FilterListIcon from '@material-ui/icons/FilterList'
import SearchIcon from '@material-ui/icons/Search'
import FormatLineSpacingIcon from '@material-ui/icons/FormatLineSpacing'
import CloseIcon from '@material-ui/icons/Close'
import MenuIcon from '@material-ui/icons/Menu'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'

import { loadAll as loadCategories } from 'tools/modules/category'
import { loadAll as loadServices, updateProQuestions } from 'tools/modules/service'
import { loadAll as loadAllProQuestions, update as updateProQuestion, remove as removeProQuestion } from 'tools/modules/proQuestion'
import { open as openSnack, close as closeSnack } from 'tools/modules/snack'
import Loading from 'components/Loading'
import { sections } from '@smooosy/config'


import Card from 'tools/components/dashboard/Card'
import Column from 'tools/components/dashboard/Column'
import ProQuestionForm from 'tools/components/dashboard/ProQuestionForm'

const renderCard = props => {
  const { item, count, deleteItem, styles } = props
  return (
    <div style={styles.content}>
      <div style={{display: 'flex'}}>
        <div style={styles.summary}>{item.text}</div>
        <CloseIcon style={styles.close} onClick={deleteItem} />
      </div>
      <div>{item.proAnswers && item.proAnswers.length}人のプロが回答</div>
      <Link to={`/proQuestions/${item.id}`}>{item.publishedProAnswerCount}件掲載中</Link>
      <div style={styles.count}>{(count || []).length}回利用</div>
      {item.isPublished ? <div style={styles.published}>公開中</div> : <div style={styles.unpublished}>非公開</div>}
    </div>
  )
}

const renderHead = ({service}) => <div>{service.name}</div>

@connect(
  state => ({
    categories: state.category.categories,
    allServices: state.service.allServices,
    allProQuestions: state.proQuestion.proQuestions || [],
  }),
  { loadCategories, loadServices, loadAllProQuestions, updateProQuestions, updateProQuestion, removeProQuestion, openSnack, closeSnack }
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
}))
@DragDropContext(HTML5Backend)
export default class ProQuestionDashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
      // 絞り込み条件
      cond: {
        category: 'カメラマン',
        proQuestionCategory: 'カメラマン',
      },
      services: [],
      proQuestions: [],
      count: {},
      source: {}, // ドラッグ元
      dest: {}, // ドラッグ先
      backup: null, // UNDOのためのバックアップ
      dense: true, // 詳細を隠す
    }
  }

  componentDidMount() {
    this.loadAll()
  }

  loadAll = (type) => {
    if (!type || type === 'services') {
      this.props.loadServices('proQuestion').then(() => {
        this.filter()
        this.countItem()
        this.setState({loaded: true})
      })
    }
    if (!type || type === 'proQuestions') {
      this.props.loadAllProQuestions().then(() => {
        this.filter()
      })
    }
    this.props.loadCategories()
  }

  countItem = () => {
    const count = {}
    for (let s of this.props.allServices) {
      for (let q of s.proQuestions) {
        (count[q.id] || (count[q.id] = [])).push(s.name)
      }
    }
    this.setState({count})
  }

  // 絞り込み条件を元にservicesとproQuestionsを絞り込んで表示させる
  // 絞り込み条件の保存も行う
  filter = (newCond) => {
    const cond = {...this.state.cond, ...newCond}

    // サービス絞り込みカテゴリを変えたら質問のカテゴリも変える
    if (newCond && newCond.category) {
      cond.proQuestionCategory = newCond.category
    }

    const skip = newCond && !('category' in newCond) && !('proQuestion' in newCond)

    const services = skip ?
      this.state.services :
      this.props.allServices.filter(s => {
        const searchTargets = [s.name, s.providerName, ...s.tags]
        const searchText = searchTargets.join()
        return (
          (cond.category === 'all' || s.tags.indexOf(cond.category) !== -1) &&
          s.enabled &&
          (!cond.proQuestion || cond.proQuestion.split(/[\s\u3000]/).every(e => searchText.indexOf(e) !== -1))
        )
      }).slice(0, 50)

    const proQuestions = this.props.allProQuestions.filter(q =>
      (q.tags.indexOf(cond.proQuestionCategory) !== -1 || q.tags.length === 0)
    )

    this.setState({
      services,
      proQuestions,
      cond,
      anchor: null,
      proQuestionAnchor: null,
    })
  }

  // 子componentから親のstateを変えるための関数
  setMainState = state => {
    this.setState(state)
  }

  // sourceとdestを元に更新を行う
  update = () => {
    const { services, proQuestions, source, dest, copy } = this.state
    if (Object.keys(source).length === 0 || Object.keys(dest).length === 0) return
    if (source.column === dest.column && source.index === dest.index) return

    // 追加するanswer
    const target = source.column < 0 ? proQuestions[source.index] : services[source.column].proQuestions[source.index]

    if (source.column !== dest.column && copy) {
      this.setState({
        editItem: {
          text: target.text,
          type: target.type,
          tags: services[dest.column].tags[0] ? [services[dest.column].tags[0]] : [],
        },
        appendColumn: dest.column,
      })
      return
    }

    this.setState({
      backup: {
        index: dest.column,
        proQuestions: [...services[dest.column].proQuestions],
      },
    })

    // 追加されるanswer配列
    const newProQuestions = services[dest.column].proQuestions
    if (source.column === dest.column) {
      // 同じservice内の場合並び替え
      newProQuestions.splice(source.index, 1)
      newProQuestions.splice(dest.index, 0, target)
    } else {
      // すでに含む場合追加しない
      if (newProQuestions.map(q => q.id).indexOf(source.id) !== -1) return

      // 違うserviceにはコピーする
      newProQuestions.splice(dest.index, 0, target)

      this.countItem()
    }
    this.props.updateProQuestions(services[dest.column])
      .then(() => this.snack())
  }

  // 1つ前の状態に戻す
  undo = () => {
    const { services, backup } = this.state
    this.props.closeSnack()
    if (!backup) return

    services[backup.index].proQuestions = backup.proQuestions
    this.countItem()
    this.props.updateProQuestions(services[backup.index])
  }

  // serviceから指定のanswerを削除する
  deleteItem = (column, index) => {
    const { services } = this.state

    this.setState({
      backup: {
        index: column,
        proQuestions: [...services[column].proQuestions],
      },
    })

    services[column].proQuestions.splice(index, 1)
    this.countItem()
    this.props.updateProQuestions(services[column])
      .then(() => this.snack())
  }

  updateProQuestion = values => {
    const { services, appendColumn } = this.state
    return this.props.updateProQuestion(values).then(proQuestion => {
      this.setState({editItem: null})
      if (values.id) {
        // update
        this.loadAll()
      } else {
        // insert
        const newProQuestions = services[appendColumn].proQuestions
        newProQuestions.push(proQuestion)

        this.countItem()
        this.props.updateProQuestions(services[appendColumn]).then(() => {
          this.loadAll('proQuestions')
        })
      }
    })
  }

  removeProQuestion = values => {
    this.props.removeProQuestion(values).then(() => {
      this.setState({editItem: null})
      this.loadAll()
    })
  }

  // 新規作成モーダルを開く
  newItem = (service, appendColumn) => {
    this.setState({
      editItem: {
        type: 'textarea',
        tags: service.tags[0] ? [service.tags[0]] : [],
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

  snack = () => {
    const option = {
      action: [
        <Button key='undo' color='secondary' size='small' onClick={this.undo}>
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
      duration: 8000,
      anchor: {vertical: 'bottom', horizontal: 'left'},
    }
    this.props.openSnack('保存しました', option)
  }

  render() {
    const { theme, categories } = this.props
    const { loaded, cond, services, proQuestions, count, source, dest, editItem } = this.state
    const { common, grey, primary } = theme.palette

    if (!loaded) {
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
                {categories.filter(s => s.parent === sec.key).map(sub =>
                  <MenuItem key={sub.key} selected={cond.category === sub.name} onClick={() => this.filter({category: sub.name})}>{sub.name}</MenuItem>
                )}
              </div>
            )}
          </Menu>
          <div style={{...styles.control, display: 'flex', alignItems: 'center'}}>
            <SearchIcon />
            <TextField style={{width: 200}} placeholder='検索ワード' onChange={e => this.filter({proQuestion: e.target.value})} type='search' />
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
          classes={{paper: this.props.classes.drawerPaper}}
        >
          <div style={{height: 40, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${grey[300]}`}}>
            <IconButton onClick={() => this.setState({drawer: false})}>
              <ChevronRightIcon />
            </IconButton>
            <div style={{flex: 1}} />
          </div>
          <div style={styles.drawerColumn}>
            <Tooltip title='カテゴリ絞り込み' style={{marginBottom: 6}}>
              <Button size='small' style={{maxWidth: '100%'}} onClick={e => this.setState({proQuestionAnchor: e.currentTarget})}>
                <FilterListIcon />
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{cond.proQuestionCategory === 'all' ? '共通' : cond.proQuestionCategory}</div>
              </Button>
            </Tooltip>
            <Menu
              open={!!this.state.proQuestionAnchor}
              anchorEl={this.state.proQuestionAnchor}
              onClose={() => this.setState({proQuestionAnchor: null})}
            >
              <MenuItem selected={cond.proQuestionCategory === 'all'} onClick={() => this.filter({proQuestionCategory: 'all'})}>共通</MenuItem>
              {sections.map(sec =>
                <div key={sec.key}>
                  <ListSubheader style={styles.subheader}>{sec.name}</ListSubheader>
                  {categories.filter(c => c.parent === sec.key).map(c =>
                    <MenuItem key={c.key} selected={cond.proQuestionCategory === c.name} onClick={() => this.filter({proQuestionCategory: c.name})}>{c.name}</MenuItem>
                  )}
                </div>
              )}
            </Menu>
            {proQuestions.map((q, i) =>
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
                focus={(source.id || this.state.focusItem) === q.id}
                onMouseEnter={focusItem => !source.id && this.setState({focusItem})}
                onMouseLeave={() => !source.id && this.setState({focusItem: null})}
                renderCard={renderCard}
              />
            )}
          </div>
        </Drawer>
        <div style={styles.row}>
          {services.map((s, i) =>
            <Column
              key={s.id}
              target='ProQuestionDashboard'
              service={s}
              items={s.proQuestions || []}
              count={count}
              column={i}
              source={source}
              dest={dest}
              dense={this.state.dense}
              copy={this.state.copy}
              setMainState={this.setMainState}
              update={this.update}
              edit={editItem => this.setState({editItem})}
              focusItem={this.state.focusItem}
              deleteItem={this.deleteItem}
              newItem={() => this.newItem(s, i)}
              moveColumn={this.moveColumn}
              renderHead={renderHead}
              renderCard={renderCard}
            />
          )}
        </div>
        <Dialog open={!!editItem} onClose={() => this.setState({editItem: null, appendColumn: null})}>
          <ProQuestionForm
            initialValues={editItem}
            services={editItem ? count[editItem.id] : null}
            onSubmit={this.updateProQuestion}
            onRemove={this.removeProQuestion}
          />
        </Dialog>
      </div>
    )
  }
}
