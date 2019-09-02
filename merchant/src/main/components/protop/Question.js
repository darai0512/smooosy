import React from 'react'
import { withStyles } from '@material-ui/core'

const questions = [
  {
    title: 'SMOOOSYのメリットはなんですか？',
    description: 'ドタキャン発生時、即座にお店の近くにいる見込み客に募集をかけることができます。事前決済により、連鎖的なキャンセルに歯止めをかけられます。さらに、予約表と連携した自動募集機能などもございます。',
  },
  {
    title: '値下げは必要ですか？',
    description: '任意ですが、値下げをした場合の成約率は1.5倍になっております。',
  },
]

const Question = withStyles((theme) => ({
  container: {
    background: theme.palette.common.white,
    padding: '96px 0',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    lineHeight: '30px',
    textAlign: 'center',
    margin: '0 auto 56px',
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
  questionContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 1000,
  },
}))(({classes}) => (
  <div className={classes.container}>
    <h2 className={classes.title}>よくある質問</h2>
    <div className={classes.wrapper}>
      <div className={classes.questionContainer}>
        {questions.map(q =>
          <QuestionCard key={q.title} title={q.title} description={q.description} subDescription={q.subDescription} />
        )}
      </div>
    </div>
  </div>
))

const QuestionCard = withStyles((theme) => ({
  question: {
    width: '100%',
    maxWidth: 468,
    minHeight: 210,
    marginBottom: 24,
    background: theme.palette.common.white,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    marginLeft: 12,
    marginRight: 12,
    [theme.breakpoints.down('xs')]: {
      minHeight: 'auto',
      marginLeft: 16,
      marginRight: 16,
    },
  },
  container: {
    padding: 24,
  },
  title: {
    height: 54,
    color: theme.palette.lightGreen.G550,
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: '150%',
    marginBottom: 8,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 13,
    },
  },
  answer: {
    color: theme.palette.grey.G950,
    fontSize: 14,
    lineHeight: '180%',
  },
  subDescription: {
    fontSize: 12,
    marginTop: 8,
  },
}))(({title, description, subDescription, classes}) => (
  <div className={classes.question}>
    <div className={classes.container}>
      <h3 className={classes.title}>{title}</h3>
      <p className={classes.answer}>
        {description}
      </p>
      {subDescription && <p className={classes.subDescription}>{subDescription}</p>}
    </div>
  </div>
))

export default Question
