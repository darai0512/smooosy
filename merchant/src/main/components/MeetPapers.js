import React from 'react'
import { Paper } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'

import UserAvatar from 'components/UserAvatar'
import { priceFormat } from 'lib/string'

@withWidth({
  largeWidth: 1020,
})
@withTheme
export default class MeetPapers extends React.PureComponent {
  render() {
    const { meets, service, customer, width, theme, averagePrice } = this.props
    const { grey } = theme.palette

    if (!meets) return null

    const scroll = width === 'xs' || (width === 'sm' && meets.length > 3)

    const styles = {
      root: {
      },
      meets: {
        margin: '30px 0 40px',
      },
      padding: {
        display: 'flex',
        justifyContent: scroll ? 'flex-start' : 'center',
        alignItems: 'stretch',
        overflowX: scroll ? 'auto' : 'initial',
        padding: scroll ? '0 10px' : 0,
        WebkitOverflowScrolling: 'touch',
      },
      meet: {
        width: 230,
        minWidth: 230,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        marginLeft: scroll ? 0 : -14,
        marginRight: scroll ? 0 : -14,
        padding: '0 5px',
      },
      dummyMeet: {
        width: 230,
        minWidth: 230,
        marginLeft: -14,
        marginRight: -14,
        padding: '0 5px',
      },
      message: {
        position: 'relative',
        margin: '10px 0 0',
        padding: '10px 0 0',
        borderTop: `1px solid ${grey[300]}`,
        fontSize: 12,
        height: 280,
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }

    return (
      <div style={styles.root}>
        {averagePrice ?
          <div style={{textAlign: 'center', margin: '10px 0 20px'}}>
            <div style={{fontWeight: 'bold', fontSize: 20}}>平均価格</div>
            <div style={{fontSize: 32, fontWeight: 'bold'}}>{priceFormat({price: averagePrice})}</div>
          </div>
        : null}
        <div style={styles.meets}>
          <div style={styles.padding}>
            {meets.map((meet, i) =>
              <div key={i} style={{
                ...styles.meet,
                zIndex: 3 - Math.floor(Math.abs((meets.length-1)/2 - i)),
                marginTop: scroll ? 10 : Math.abs(Math.ceil((meets.length-1)/2) - i) * 10,
                transform: scroll ? 'none' : `scale(${1 - Math.abs(Math.ceil((meets.length-1)/2) - i)/20}, ${1 - Math.abs(Math.ceil((meets.length-1)/2) - i)/20})`,
              }}>
                <Paper style={{width: '100%', height: '100%', borderRadius: 5, padding: width === 'xs' ? '12px 12px 0' : '20px 20px 0'}}>
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <UserAvatar user={{_id: i+''}} alt={`${service.providerName + String.fromCharCode(65 + i)}`} style={{width: 64, height: 64}} />
                  </div>
                  <div style={{margin: 10, fontWeight: 'bold'}}>
                    {service.providerName}{String.fromCharCode(65 + i)}
                  </div>
                  <div style={styles.message}>
                    {meet.chats[0].text && meet.chats[0].text.replace(/UUU/g, customer).replace(/PPP/g, String.fromCharCode(65 + i))}
                  </div>
                </Paper>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}
