import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Paper, IconButton, Button, Tooltip } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import NavigationClose from '@material-ui/icons/Close'
import ActionDelete from '@material-ui/icons/Delete'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationCheck from '@material-ui/icons/Check'

import { loadAll, update, remove } from 'modules/media'
import { open as openSnack } from 'modules/snack'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ConfirmDialog from 'components/ConfirmDialog'
import MediaSlider from 'components/MediaSlider'
import renderTextArea from 'components/form/renderTextArea'
import { serial } from 'lib/util'
import { imageSizes } from '@smooosy/config'

@withWidth()
@connect(
  state => ({
    media: state.media.media,
  }),
  { loadAll, update, remove, openSnack }
)
@reduxForm({
  form: 'media',
})
@withStyles(theme => ({
  wrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    cursor: 'pointer',
    opacity: 0,
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('xs')]: {
      opacity: 1,
    },
  },
}), {withTheme: true})
export default class MediaList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      checked: [],
    }
  }

  componentDidMount() {
    this.props.loadAll()
  }

  clickImage = (slideNumber, m) => {
    if (this.state.checked.length) {
      this.toggle(m.id)
    } else {
      this.props.initialize(m)
      this.setState({slideNumber})
    }
  }

  toggle = (id) => {
    const checked = [...this.state.checked]
    const index = checked.indexOf(id)
    if (index === -1) {
      checked.push(id)
    } else {
      checked.splice(index, 1)
    }

    this.setState({checked})
  }

  handleDelete = () => {
    serial(this.state.checked, id => this.props.remove(id))
    this.setState({checked: [], deleteDialog: false})
  }

  saveMedia = (values) => {
    this.props.update(values.id, {text: values.text})
      .then(() => this.props.openSnack('保存しました'))
  }

  render() {
    const { checked, slideNumber } = this.state
    const { media, handleSubmit, width, theme, classes } = this.props
    const { common, grey, secondary } = theme.palette

    if (!media) return null

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: common.white,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      editHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        height: 50,
        background: secondary.main,
        color: common.white,
      },
      main: {
        margin: '30px 10px',
      },
      media: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
      },
      paper: {
        position: 'relative',
        width: width === 'xs' ? '20vw' : 100,
        height: width === 'xs' ? '20vw' : 100,
        maxWidth: 100,
        maxHeight: 100,
        margin: 5,
        cursor: 'pointer',
        ':hover': {},
      },
      dummy: {
        width: width === 'xs' ? '20vw' : 100,
        maxWidth: 100,
        margin: '0 5px',
      },
      image: {
        width: '100%',
        height: '100%',
      },
      checkCircle: {
        position: 'absolute',
        top: 3,
        left: 3,
        color: common.white,
        background: secondary.main,
        padding: 3,
        borderRadius: 50,
      },
      checkNumber: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        fontSize: 20,
        color: secondary.main,
        border: `5px solid ${secondary.main}`,
        background: 'rgba(0, 0, 0, .5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
      },
    }

    return (
      <AutohideHeaderContainer
        fixed={true}
        style={styles.root}
        header={checked.length ?
          <div style={styles.editHeader}>
            <IconButton onClick={e => {
              e.preventDefault();this.setState({checked: []})
            }}>
              <NavigationClose style={{color: common.white}} />
            </IconButton>
            <div>{checked.length}枚を選択中</div>
            <div style={{flex: 1}} />
            <Tooltip title='削除'>
              <IconButton onClick={() => this.setState({deleteDialog: true})}>
                <ActionDelete style={{color: common.white}} />
              </IconButton>
            </Tooltip>
          </div>
          :
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
                </Link>
              }
            </div>
            <div>写真を管理</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>写真を管理</title>
        </Helmet>
        <div style={styles.main}>
          <div style={styles.media}>
            {media.map((m, i) => {
              const index = checked.indexOf(m.id)
              return (
                <div key={m.id} style={styles.paper}>
                  <Paper style={{width: '100%', height: '100%', position: 'relative'}}>
                    <img alt={m.text} src={m.url + imageSizes.c160} style={styles.image} />
                    {m.type === 'video' && <AvPlayCircleFilled style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, color: 'rgba(255, 255, 255, .5)'}} />}
                    {index > -1 &&
                      <div style={styles.checkNumber}>
                        <NavigationCheck style={{width: '50%', height: '50%', color: secondary.main}} />
                      </div>
                    }
                  </Paper>
                  <div className={classes.wrap} style={index === -1 ? null : {opacity: 0}} onClick={() => this.clickImage(i, m)}>
                    <NavigationCheck style={styles.checkCircle} onClick={e => {
                      e.preventDefault();e.stopPropagation();this.toggle(m.id)
                    }} />
                  </div>
                </div>
              )
            })}
            {[...Array(20)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummy} />)}
          </div>
        </div>
        <ConfirmDialog
          open={!!this.state.deleteDialog}
          title={`${checked.length}枚の写真を削除しますか？`}
          onClose={() => this.setState({deleteDialog: false})}
          onSubmit={this.handleDelete}
        >
          <div>関連するプロフィールからも削除されます</div>
        </ConfirmDialog>
        <MediaSlider
          media={media}
          slideNumber={slideNumber}
          onClose={() => this.setState({slideNumber: null})}
          willChange={(_, nextIndex) => this.props.initialize(media[nextIndex])}
          content={() =>
            <div style={{maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'flex-start'}}>
              <Field labelStyle={{flex: 1, marginRight: 10}} name='text' component={renderTextArea} type='text' textareaStyle={{resize: 'none'}} />
              <Button variant='contained' color='primary' onClick={handleSubmit(this.saveMedia)} >保存する</Button>
            </div>
          }
        />
      </AutohideHeaderContainer>
    )
  }
}
