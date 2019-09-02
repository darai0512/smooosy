import React from 'react'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'

import { update as updateService, loadPriceEstimate } from 'tools/modules/service'
import SelectQuery from 'components/SelectQuery'
import PricePaper from 'components/PricePaper'

@withStyles(() => ({
  root: {
    padding: '20px 0',
  },
  row: {
    display: 'flex',
    marginBottom: 20,
  },
  side: {
    width: 400,
  },
  result: {
    flex: 1,
    marginLeft: 40,
  },
  pricePaper: {
    width: 600,
    height: 333,
  },
  list: {
    padding: '5px 0',
  },
  button: {
    marginRight: 10,
  },
  empty: {
    width: 600,
    padding: 40,
  },
}))
@connect(
  state => ({
    priceEstimate: state.service.priceEstimate,
  }),
  { updateService, loadPriceEstimate }
)
export default class ServicePriceEstimate extends React.Component {
  state = {
    questions: [],
  }

  componentDidMount() {
    this.setQuestions()
    this.load()
  }

  load = (questions = []) => {
    const key = this.props.service.key
    questions = questions.map(q => ({
      id: q.id,
      answers: q.answers.filter(a => a.checked).map(a => a.id),
    }))
    this.props.loadPriceEstimate(key, questions)
  }

  setQuestions = service => {
    const { queries, priceEstimateQueries } = service || this.props.service
    const questions = []
    for (let query of queries) {
      const peq = priceEstimateQueries.find(q => q.query === query.id)
      if (!peq) continue
      query.answers = query.options.filter(o => peq.options.includes(o.id))
      questions.push(query)
    }
    this.setState({questions})
  }

  addQuery = (query) => {
    const { id, priceEstimateQueries } = this.props.service
    priceEstimateQueries.push({
      query: query.id,
      options: query.options.map(o => o.id),
    })
    this.props.updateService({ id, priceEstimateQueries })
      .then(this.props.load).then(this.setQuestions)
  }

  removeQuery = (query) => {
    const { id, priceEstimateQueries } = this.props.service
    this.props.updateService({
      id,
      priceEstimateQueries: priceEstimateQueries.filter(q => q.query !== query.id),
    })
      .then(this.props.load).then(this.setQuestions)
  }

  removeOption = (query, option) => {
    const { id, priceEstimateQueries } = this.props.service
    priceEstimateQueries.map(q => {
      if (q.query === query.id) q.options = q.options.filter(o => o !== option.id)
      return q
    })
    this.props.updateService({ id, priceEstimateQueries })
      .then(this.props.load).then(this.setQuestions)
  }

  onChange = (questionId, answers) => {
    const { questions } = this.state
    const question = questions.find(q => q.id === questionId)
    question.answers = answers
    this.setState({questions})
    this.load(questions)
  }

  render() {
    const { service: { queries }, priceEstimate, classes } = this.props
    const { questions } = this.state
    if (!priceEstimate) return null

    return (
      <div className={classes.root}>
        <div className={classes.row}>
          <div className={classes.side}>
            {questions.map(q =>
              <div key={q.id}>
                <h3>
                  {q.text}
                  <DeleteIcon onClick={() => this.removeQuery(q)} />
                </h3>
                <SelectQuery
                  query={q}
                  answers={q.answers}
                  onChange={answers => this.onChange(q.id, answers)}
                  onRemove={this.removeOption}
                />
              </div>
            )}
          </div>
          <div className={classes.result}>
            {Object.keys(priceEstimate).length ?
              <>
                <PricePaper title='価格推定' price={priceEstimate} className={classes.pricePaper} />
              </>
            :
              <div className={classes.empty}>データが足りません</div>
            }
          </div>
        </div>
        {queries.map(query =>
          query.type === 'singular' || query.type === 'multiple' ?
          <div key={query.id} className={classes.list}>
            <Button
              className={classes.button}
              color='primary'
              variant='contained'
              onClick={() => this.addQuery(query)}
              disabled={questions.map(q => q.id).includes(query.id)}
            >
              追加する
            </Button>
            {query.text}
          </div>
          : null
        )}
      </div>
    )
  }
}
