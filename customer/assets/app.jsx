const {
  CircularProgress,
  makeStyles,
  Icon,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  CssBaseline,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} = MaterialUI;
const useStyles = makeStyles(theme => ({
  '@global': {
    '*::-webkit-scrollbar': {
      width: 0,
      background: 'transparent',
    },
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
  button: {
    margin: theme.spacing(1),
  },
  navIcon: {
    fontSize: 30,
  },
  timelineIcon: {
    fontSize: 18,
  },
  closeIcon: {
    fontSize: 16,
    float: 'right',
  },
  text: {
    padding: theme.spacing(2, 2, 0),
  },
  list: {
    marginBottom: theme.spacing(2),
    width: '100%',
    overflowY: 'scroll',
    height: '45vh',
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));
function CountDown(p) {
  const [val, setVal] = React.useState({
    afterSec: p.afterSec,
  });
  const intervalSec = val.afterSec > 5 * 60 ? 60 : 1;
  setTimeout(setVal, intervalSec * 1000, {afterSec: val.afterSec - intervalSec});
  const remainingDate = new Date(val.afterSec * 1000);
  if (intervalSec === 1) {
    const minute = `0${remainingDate.getMinutes()}`.slice(-2);
    const sec = `0${remainingDate.getSeconds()}`.slice(-2);
    return (
      <span style={{color: 'red'}}>{`${minute}:${sec}`}</span>
    );
  }
  return (
    <span>{`${remainingDate.getMinutes()}分以内`}</span>
  );
}
// todo invisible:falseなどreactでのtimer制御
function TimelineItem(p) {
  const c = useStyles();
  setTimeout(p.deleteFn, p.afterSec * 1000);
  return (
    <ListItem button alignItems="flex-start" onClick={p.changeMode}>
      <Icon className={c.timelineIcon}>{`filter_${p.sid}`}</Icon>
      <ListItemAvatar>
        <Avatar alt="StoreImage" src={p.image} style={{ borderRadius: 0 }}/>
      </ListItemAvatar>
      <ListItemText primary={p.name} secondary={p.serviceType} style={{width: '25%'}}/>
      <div style={{textAlign: 'center', width: '20%'}}>
        <div><Icon>schedule</Icon></div>
        <CountDown afterSec={p.afterSec} />
        <div>先着1名限り</div>
      </div>
      <div style={{textAlign: 'center', width: '20%'}}>
        <div><Icon>money_off</Icon></div>
        <div><s>{p.price} 円</s></div>
        <div>{p.price * p.discount} 円</div>
      </div>
      <Icon className={c.closeIcon} onClick={p.deleteFn}>close</Icon>
    </ListItem>
  );
}
function Home(p) {
  const [val, setVal] = React.useState({
    mode:  'loading',
    targetIdx: null,
    services: [],
  });
  const c = useStyles();
  if (val.mode === 'loading') {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        here.lat = pos.coords.latitude;
        here.lng = pos.coords.longitude;
        if (map) {
          map.setCenter(here);
          const marker = new google.maps.Marker({
            position: here,
            map,
            icon: {
              url: `./images/man.png`,
            },
          });
        }
        const response = await fetch(`${window.location.origin}/services?location=${here.lat},${here.lng}`);
        const services = await response.json();
        console.log(services);
        setVal(Object.assign({...val}, {services, mode: 'timeline'}));
      }, () => {
        setVal(Object.assign({...val}, {mode: 'failed'}));
      });
    } else {
      return (<div className={c.list}>位置情報の取得ができない端末のため本サービスをご利用いただけません。</div>);
    }
    return (<div className={c.list} style={{textAlign: 'center'}}>
      <CircularProgress />
      <p>'位置情報を取得中です...'</p>
      <p>ロゴが決まればこの時間にそれを表示する予定です</p>
    </div>);
  } else if (val.mode === 'failed') {
    return (<div className={c.list} style={{textAlign: 'center'}}>
      <p>'位置情報の取得に失敗しました。リロードして再試行下さい。'</p>
    </div>);
  } else if (val.mode === 'detail') {
    const toTL = function (e) {
      setVal(Object.assign({...val}, {mode: 'timeline'}));
    }
    const del = function (e) {
      if (val.services[val.targetIdx].marker) val.services[val.targetIdx].marker.setMap(null);
      val.services.splice(val.targetIdx, 1);
      setVal(Object.assign({...val}, {
        mode: 'timeline',
      }));
    }
    const s = val.services[val.targetIdx];
    return (
      <div className={c.list} style={{fontSize: 16}}>
        <p>1 名様まで!</p>
        <p>ここに以下のような詳細情報が入ります。</p>
        <p>・サービス詳細 / 店舗HP / 店舗住所詳細 / 店舗までの行き方 / 店舗電話番号 / 口コミ</p>
        <p>・決済方法(事前決済のみならアプリ上で or 現地支払い)</p>
        <p>予約すると決済などを経て(左下の)履歴画面に遷移してナビゲートが始まり、またホーム画面から同時間帯のサービスは削除されます（但し現在は開発中のため予約機能・履歴画面はない）</p>
        <Button variant="contained" color="primary" className={c.button}>
          予約する
        </Button>
        <Button variant="contained" color="secondary" className={c.button} onClick={del}>
          興味ない
        </Button>
        <Button variant="contained" className={c.button} onClick={toTL}>
          戻る
        </Button>
      </div>
    );
  }
  return (
    <List className={c.list}>{
      val.services.map((v, i)=> {
        if (!v.marker && map) {
          v.marker = new google.maps.Marker({
            position: {lat: v.lat, lng: v.lng},
            map,
            animation: google.maps.Animation.DROP,
            icon: {
              url: `./images/2x/baseline_filter_${v.sid}_black_18dp.png`,
              scaledSize: new google.maps.Size(25, 25),
            },
          });
          v.marker.addListener('click', function(){
            setVal(Object.assign({...val}, {mode: 'detail', targetIdx: i}));
          });
        }
        v.deleteFn = function (e) {
          if (e) e.stopPropagation();
          if (v.marker) v.marker.setMap(null);
          val.services.splice(i, 1);
          setVal({...val});
        }
        v.changeMode = function (e) {
          e.stopPropagation();
          // 先客ができたらwsなどでリアルタイム削除の方が良さそう?
          // if (v.sid === 1) setVal(Object.assign({...val}, {mode: 'outofservice', targetIdx: i}));
          setVal(Object.assign({...val}, {mode: 'detail', targetIdx: i}));
        }
        return (<TimelineItem {...v} />);
      })
    }</List>
  );
}
function Settings(p) {
  const c = useStyles();
  // todo https://github.com/amarofashion/react-credit-cards
  const [values, setValues] = React.useState({
    name: '',
    birth: '', // YYYY-MM-DD
    phone: '',
    gender: '',
    eMail: '',
  });
  const handleChange = key => event => {
    console.log(key, event.target.value)
    setValues({ ...values, [key]: event.target.value });
  };
  return (<div className={c.list} style={{fontSize: 16}}>
    <p>開発中</p>
    <p>下記に加えて決済方法入力(クレジットカード登録、LinePayなど)を追加予定</p>
    <form className={c.container} noValidate autoComplete="off">
      <TextField
        required
        id="name"
        label="氏名"
        className={c.textField}
        value={values.name}
        onChange={handleChange('name')}
        margin="normal"
      />
      <TextField
        id="birth"
        label="生年月日"
        type="date"
        className={c.textField}
        value={values.birth}
        onChange={handleChange('birth')}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <FormControl required className={c.formControl}>
        <InputLabel htmlFor="gender">性別</InputLabel>
        <Select
          value={values.gender}
          onChange={handleChange('gender')}
          inputProps={{name: 'gender', id: 'gender'}}
        >
          <MenuItem value={0}>男性</MenuItem>
          <MenuItem value={1}>女性</MenuItem>
          <MenuItem value={2}>どちらでもない</MenuItem>
          <MenuItem value={3}>答えたくない</MenuItem>
        </Select>
      </FormControl>
      <TextField
        id="phone"
        label="電話番号"
        className={c.textField}
        value={values.phone}
        onChange={handleChange('phone')}
        margin="normal"
      />
      <TextField
        id="name"
        label="メールアドレス"
        className={c.textField}
        value={values.eMail}
        onChange={handleChange('eMail')}
        margin="normal"
      />
    </form>
  </div>);
}
function History(p) {
  const c = useStyles();
  return (
    <div className={c.list} style={{fontSize: 16}}>
      <p>開発中</p>
      <p>最新の予約内容をナビゲートし、スクロールすると過去の予約履歴も見れます</p>
      <p>ナビゲートは、上のMapに位置関係を表示しつつ、電車の乗り継ぎや時間管理など</p>
    </div>
  );
}
function Main(p) {
  if (p.current === 'home') return (<Home />);
  else if (p.current === 'settings') return (<Settings />);
  else return (<History />);
}
function BottomNavs(p) {
  const c = useStyles();
  const navs = ['list_alt', 'home', 'settings'].map(v => {
    const style = v === p.current ? {} : {color: 'disabled'};
    const icon = (<Icon className={c.navIcon} {...style}>{v}</Icon>);
    return (<BottomNavigationAction value={v} icon={icon} />);
  });
  return (
    <BottomNavigation
      value={p.current}
      onChange={p.handler}
    >
      {navs}
    </BottomNavigation>
  );
}
function App(p) {
  const [current, setCurrent] = React.useState('home');
  return (
    <div>
      <CssBaseline />
      <Main current={current} />
      <BottomNavs current={current} handler={(e, newValue) => {
        setCurrent(newValue);
      }} />
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'));
