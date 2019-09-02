import React from 'react'
import { Link } from 'react-router-dom'
import { CardMedia, Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { amber } from '@material-ui/core/colors'
import withWidth from '@material-ui/core/withWidth'

import { imageSizes } from '@smooosy/config'

@withWidth()
@withTheme
export default class RequestCard extends React.Component {
  static defaultProps = {
    style: {},
  }

  render() {
    const { style, request, theme, width } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        width: '100%',
        background: common.white,
        borderWidth: width === 'xs' ? '1px 0' : 1,
        borderStyle: 'solid',
        borderColor: grey[300],
        padding: width === 'xs' ? 10 : 20,
        ...style,
      },
      title: {
        display: 'flex',
      },
      description: {
        fontSize: 13,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.5,
        WebkitLineClamp: 2,
        maxHeight: '3em',
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        marginBottom: 10,
      },
      averagePrice: {
        textAlign: 'center',
        fontSize: 16,
        color: amber[900],
        margin: 5,
      },
      image: {
        flexShrink: 0,
        margin: '0 10px 0 0',
        width: width === 'xs' ? 60 : 120,
        height: width === 'xs' ? 60 : 80,
      },
    }

    const mes = request.description.filter(d => d.label === 'プロの方へのメッセージ')[0]
    let message = mes && mes.answers[0] ? mes.answers[0].text.replace(/\n+/g, ' ') + '\n' : ''
    message += request.description.filter(d => ['singular', 'multiple'].indexOf(d.type) !== -1).map(d => `[${d.label}]${d.answers.map(a => a.text).join('・')}`).join(' ')

    const button = (
      <div>
        {request.averagePrice > 0 &&
          <div style={styles.averagePrice}>平均 {request.averagePrice.toLocaleString()}円</div>
        }
        <Button
          size='small'
          variant='contained'
          color='primary'
          component={Link}
          to={`/services/${request.service.key}/requests/${request.id}`}
        >
          詳細と見積もりを確認
        </Button>
      </div>
    )

    return (
      <div style={styles.root}>
        <Link to={`/services/${request.service.key}/requests/${request.id}`}>
          {request.searchTitle}
        </Link>
        <div style={{display: 'flex', paddingTop: 10}}>
          <CardMedia
            style={styles.image}
            image={request.service.image + imageSizes.r320}
            title={request.service.name}
          />
          <div style={{minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column'}}>
            <div style={styles.description}>{message}</div>
            <div style={{display: 'flex'}}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{fontSize: 13}}>{`${request.prefecture ? `${request.prefecture}${request.city}の` : ''}${request.customer}様`}</div>
                <div style={{flex: 1}} />
                <div style={{fontSize: 11}}>
                  <Link to={`/services/${request.service.key}`}>{request.service.name}</Link>
                </div>
              </div>
              <div style={{flex: 1}} />
              <div>
                <div style={{flex: 1}} />
                {width !== 'xs' && button}
              </div>
            </div>
          </div>
        </div>
        {width === 'xs' &&
          <div style={{marginTop: 10, textAlign: 'center'}}>
            {button}
          </div>
        }
      </div>
    )
  }
}
