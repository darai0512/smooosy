import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, FieldArray, formValueSelector } from 'redux-form'
import { Button, Dialog } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { open as openSnack } from 'tools/modules/snack'
import { load as loadPageLayout, create as createPageLayout, update as updatePageLayout } from 'tools/modules/pageLayout'

import Container from 'components/Container'
import Loading from 'components/Loading'
import GridPageLayout from 'components/GridPageLayout'
import PageLayout from 'tools/components/PageLayout'

const selector = formValueSelector('PageLayoutForm')

@withStyles({
  paper: {
    maxWidth: 1024,
  },
})
@connect(
  state => ({
    layout: selector(state, 'layout'),
  }),
  { loadPageLayout, createPageLayout, updatePageLayout, openSnack }
)
@reduxForm({
  form: 'PageLayoutForm',
})
export default class PageLayoutForm extends React.Component {
  state = {
    initialValues: null,
    preview: false,
  }

  componentDidMount() {
    const { id } = this.props
    this.initialize(id)
  }

  initialize = id => {
    if (!id) {
      const pageLayout = {
        layout: [],
      }
      this.props.initialize(pageLayout)
      this.setState({
        initialValues: pageLayout,
      })
      return
    }

    this.setState({
      initialValues: null,
    })
    // service page API も pageLayout を返すが、
    // キャッシュされて更新がすぐには反映されないため、ここで直接 load する
    this.props.loadPageLayout(id)
      .then(({pageLayout}) => {
        this.props.initialize(pageLayout)
        this.setState({
          initialValues: pageLayout,
        })
      })
  }

  onSubmit = pageLayout => {
    this.props.openSnack('保存しました')
    this.props.initialize(pageLayout)
    this.setState({
      initialValues: pageLayout,
    })
  }

  submit = values => {
    const { id } = this.props

    if (!id) {
      return this.props.createPageLayout(values)
        .then(({pageLayout}) => {
          this.props.onCreate(pageLayout)
          this.onSubmit(pageLayout)
        })
    }

    return this.props.updatePageLayout(id, values)
      .then(({pageLayout}) => this.onSubmit(pageLayout))
  }

  render() {
    const { type, layout, layoutProps, isService, handleSubmit, submitting, classes } = this.props
    const { initialValues, preview } = this.state

    if (!initialValues) {
      return <Loading />
    }

    return (
      <form>
        <FieldArray
          name='layout'
          type={type}
          component={PageLayout}
          layout={layout}
          initialValues={initialValues.layout}
          isService={isService}
        />
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button color='secondary' style={{marginLeft: 10}} onClick={() => this.setState({preview: true})}>
            プレビュー
          </Button>
          <Button disabled={submitting} variant='contained' color='secondary' style={{marginLeft: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
        <Dialog
          open={!!preview}
          classes={{paper: classes.paper}}
          onClose={() => this.setState({preview: false})}
        >
          <Container>
            <GridPageLayout
              pageLayout={{
                layout,
              }}
              {...layoutProps}
            />
          </Container>
        </Dialog>
      </form>
    )
  }
}