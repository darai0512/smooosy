const {
  colors,
  makeStyles,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
  Grid,
  Icon,
  BottomNavigation,
  BottomNavigationAction,
} = MaterialUI;

const useStyles = makeStyles(theme => ({
  footerArea: {
    textAlign: 'center',
    '&:hover': {
      color: colors.red[800],
    },
  },
  footerIcon: {
    fontSize: 30,
  },
  card: {
    display: 'flex',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: '1 0 auto',
  },
  cover: {
    width: 151,
  },
  timelineIcon: {
    fontSize: 20,
  },
}));
function ServiceCard(p) {
  const c = useStyles();
  return (
    <Card className={c.card}>
      <div className={c.details}>
        <Icon className={c.timelineIcon}>{`filter_${p.num}`}</Icon>
        <CardContent className={c.content}>
          <Typography component="h5" variant="h5">
            Live From Space
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Mac Miller
          </Typography>
        </CardContent>
        <Icon className={c.timelineIcon}>close</Icon>
      </div>
      <CardMedia
        className={c.cover}
        image="./assets/images/sei-tai.png"
        title="整体"
      />
    </Card>
  );
}

function Timeline(p) {
  const serviceList = [];
  for (const [i, v] of [1,2,3,4].entries()) {
    serviceList.push(<ServiceCard num={i+1} />);
  }
  console.log(here);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      here.lat = pos.coords.latitude;
      here.lng = pos.coords.longitude;
      console.log(here);
      // fetch('./services.json').json();
      // fetch('./getServices', {body: here}).json();
    }, () => console.error('Not available geolocation API')
    );
  }
  return (<section className="timeline">
    {serviceList}
  </section>);
}
function Navi(p) {
  const c = useStyles();
  return (
    <Grid item xs className={c.footerArea}>
      <Icon className={c.footerIcon} {...p}>{p.children}</Icon>
    </Grid>
  );
}
function Footer(p) {
  const [value, setValue] = React.useState('home');
  const c = useStyles();
  const navs = ['list_alt', 'home', 'settings'].map(v => {
    const style = v === value ? {} : {color: 'disabled'};
    const icon = (<Icon {...style}>{v}</Icon>);
    return (<BottomNavigationAction value={v} icon={icon} />);
  });
  return (
    <BottomNavigation
      value={value}
      onChange={(e, newValue) => {
        console.log(newValue);
        setValue(newValue);
      }}
    >
      {navs}
    </BottomNavigation>
  );
  // return (
  //   <footer className="footer">
  //     <Grid container spacing={3}>
  //       <Navi color="disabled">list_alt</Navi>
  //       <Navi>home</Navi>
  //       <Navi color="disabled">settings</Navi>
  //     </Grid>
  //   </footer>
  // );
}
function App(p) {
  return (
    <div>
      <Timeline />
      <Footer />
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'));
