import React from 'react'
import { connect } from 'react-redux'
import { List, ListItem, ListItemText } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import Collapse from '@material-ui/core/Collapse'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'

import { loadAll } from 'modules/faq'

@connect(
  state => ({
    faqs: state.faq.faqs,
  }),
  { loadAll }
)
@withTheme
export default class FAQForPro extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: [],
    }
  }

  componentDidMount() {
    this.props.loadAll()
  }

  handleClick = (id) => {
    let open = this.state.open
    open[id] = !open[id]
    this.setState({ open: open })
  }

  render() {
    const { faqs, theme } = this.props
    const { grey } = theme.palette

    const styles = {
      root: {
        width: '90%',
        margin: '20px auto',
      },
      header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      },
      list: {
        padding: 0,
        borderBottom: `1px solid ${grey[500]}`,
      },
      title: {
        fontSize: 16,
        borderTop: `1px solid ${grey[500]}`,
      },
      body: {
        margin: 0,
        opacity: 1,
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      },
    }


    return (
      <div style={styles.root}>
        <h3 style={styles.header}>よくある質問</h3>
        <List style={styles.list}>
          {faqs.filter(faq => faq.beforeSignup).map(faq => {
            return (
              <div key={faq.id}>
                <ListItem
                  button
                  key={faq.id}
                  style={styles.title}
                  onClick={() => this.handleClick(faq.id) }
                >
                  <ListItemText primary={faq.title} />
                  {this.state.open[faq.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={this.state.open[faq.id]} timeout='auto' unmountOnExit>
                  <ListItem key={`body_${faq.id}`} style={styles.body} disabled={true}>
                    <div style={styles.faqBody} dangerouslySetInnerHTML={{__html: faq.body}} />
                  </ListItem>
                </Collapse>
              </div>
            )
          })}
        </List>
      </div>
    )
  }
}
