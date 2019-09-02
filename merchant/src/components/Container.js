import React from 'react'
import { withStyles } from '@material-ui/core/styles'


const Div = ({children, ...custom}) => <div {...custom}>{children}</div>
const Section = ({children, ...custom}) => <section {...custom}>{children}</section>
const Aside = ({children, ...custom}) => <aside {...custom}>{children}</aside>
const Article = ({children, ...custom}) => <article {...custom}>{children}</article>
const Footer = ({children, ...custom}) => <footer {...custom}>{children}</footer>

const types = {
  div: Div,
  section: Section,
  aside: Aside,
  article: Article,
  footer: Footer,
}

/*
 * 幅1024のコンテナ
 */
const Container = ({ type = 'div', style, className, gradient, grey, withPad, maxWidth, children, classes }) => {
  const rootClasses = [ classes.root ]
  if (className) rootClasses.push(className)
  if (gradient) rootClasses.push(classes.gradient)
  if (grey) rootClasses.push(classes.grey)

  const mainStyle = withPad ? { width: '95%' } : maxWidth ? { maxWidth } : null
  const Root = types[type] || Div

  return (
    <Root className={rootClasses.join(' ')} style={style}>
      <div className={classes.main} style={mainStyle}>
        {children}
      </div>
    </Root>
  )
}

export default withStyles(theme => ({
  root: {
    padding: '20px 0',
  },
  gradient: {
    background: `linear-gradient(to bottom, ${theme.palette.common.white}, ${theme.palette.grey[100]})`,
  },
  grey: {
    background: theme.palette.grey[100],
  },
  main: {
    width: '95%',
    maxWidth: 1024,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
}))(Container)
