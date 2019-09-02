import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'


const ProAnswers = ({classes, proQuestions, readMore, onClickReadMore}) => (
  <div>
    <h2 className={classes.title}>よくある質問</h2>
    <div className={classes.proAnswers}>
      {
        proQuestions.filter(pq => pq.answer).slice(0, 5).map(pq =>
          <div key={pq.id} className={classes.proanswer}>
            <h4 className={classes.question}>{pq.text}</h4>
            <div>{pq.answer}</div>
          </div>
        )
      }
      {proQuestions.filter(pq => pq.answer).length > 5 &&
        <div>
          {!readMore && <Button className={classes.readMoreButton} onClick={onClickReadMore} >さらに読む</Button>}
          {readMore &&
            proQuestions.filter(pq => pq.answer).slice(5).map(pq =>
              <div key={pq.id} className={classes.proanswer}>
                <h4 className={classes.question}>{pq.text}</h4>
                <div className={classes.text}>{pq.answer}</div>
              </div>
            )
          }
        </div>
      }
    </div>
  </div>
)

export default withStyles(theme => ({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  proAnswers: {
    marginBottom: 60,
  },
  proanswer: {
    padding: 10,
    fontSize: 13,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 3,
    marginBottom: 20,
  },
  question: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.palette.grey[800],
  },
  readMoreButton: {
    width: '100%',
    color: theme.palette.blue.A200,
  },
  text: {
    whiteSpace: 'pre-wrap',
  },
}))(ProAnswers)
