import React from 'react'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import withWidth from '@material-ui/core/withWidth'

const TopPage = ({admin, width}) => {
  if (admin < 10) return null

  const styles = {
    root: {
      margin: 10,
    },
    wrap: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    box: {
      width: 140,
      height: 50,
      margin: 5,
      textTransform: 'none',
    },
    favicon: {
      width: 20,
      height: 20,
    },
    title: {
      margin: 16,
      fontWeight: 'bold',
      fontSize: 18,
    },
    iframe: {
      width: '100%',
      height: 700,
      background: '#fff',
    },
  }

  const links = [
    { name: 'SMOOOSY', url: 'https://smooosy.com' },
    { name: 'Redash', url: 'https://redash.smooosy.com/dashboard/kgi', icon: 'https://redash.smooosy.com/static/images/favicon-32x32.png' },
    { name: 'Wiki', url: 'http://wiki.smooosy.com' },
    { name: 'Google Drive', url: 'https://drive.google.com' },
    { name: 'Analytics', url: 'https://analytics.google.com/analytics/web/', icon: 'https://ssl.gstatic.com/analytics/20180725-00/app/static/analytics_standard_icon.png' },
    { name: 'Search Console', url: 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fsmooosy.com%2F', icon: 'https://ssl.gstatic.com/search-console/scfe/search_console-16.png' },
    { name: 'AdWords', url: 'https://adwords.google.com/aw/overview?ocid=212840874', icon: 'https://www.gstatic.com/awn/awsm/brt/awn_awsm_20180723_RC04/aw_blend/ads_favicon.ico' },
    { name: 'Intercom', url: 'https://app.intercom.com/a/apps/y7t9a0od/', icon: 'https://static.intercomassets.com/assets/apple-touch-icon-iphone-6cd8ee39d659b37c82d628b8e64d538f766afb71d1e29f58bea13f97575ff780.png' },
    { name: 'SendGrid', url: 'http://app.sendgrid.com/', icon: 'https://app.sendgrid.com/icons-569f9425d703aac6c402ce69253149dd/favicon-32x32.png' },
    { name: 'Ahrefs', url: 'https://ahrefs.com/site-explorer/overview/v2/subdomains/live?target=smooosy.com' },
    { name: 'GitHub', url: 'https://github.com/smooosy/smooosy' },
    { name: 'AWS', url: 'https://smooosy.signin.aws.amazon.com/console' },
    { name: 'Datadog', url: 'https://app.datadoghq.com/screen/190001' },
    { name: 'Hotjar', url: 'https://insights.hotjar.com/sites/541494/dashboard' },
    { name: 'BrowserStack', url: 'https://live.browserstack.com/dashboard' },
  ]

  return (
    <div style={styles.root}>
      <div style={styles.title}>リンク</div>
      <div style={styles.wrap}>
        {links.map((link, i) =>
          <Button
            key={i}
            variant='outlined'
            component='a'
            href={link.url}
            target='_blank'
            rel='noopener noreferrer'
            style={styles.box}
          >
            <img src={link.icon || new URL(link.url).origin + '/favicon.ico'} style={styles.favicon} />
            <div style={{flex: 1, textAlign: 'center'}}>
              {link.name}
            </div>
          </Button>
        )}
      </div>
      <div style={styles.title}>カレンダー</div>
      <iframe src={`https://calendar.google.com/calendar/embed?showTitle=0&showTz=0&mode=${width === 'xs' ? 'AGENDA' : 'WEEK'}&height=600&wkst=2&bgcolor=%23ffffff&src=smooosy.com_ucuj4lc75kehp59f0aks4tdjbo%40group.calendar.google.com&ctz=Asia%2FTokyo`} style={{border: 0, width: '100%', height: 600}} frameBorder='0' scrolling='no' />
    </div>
  )
}

export default withWidth()(connect(
  state => ({
    admin: state.auth.admin,
  })
)(TopPage))
