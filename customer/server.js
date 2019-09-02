const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const path = require('path');
const crypto = require('crypto');
const qs = require('querystring');

const lineUrl = 'https://api.line.me/v2';
const replyUrl = `${lineUrl}/bot/message/reply`;
const reqestTimeout = 60 * 1000;

const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
const lineAuthorization = `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`;

const app = express();
// app.set('assets', path.join(__dirname, 'assets'));
app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}));
app.use(express.static('assets'));
app.use('/policies', express.static('assets/policies'))

const memoryDB = {};

app.get('/services', async (req, res) => {
  const {
    limit,
    offset,
    location,
  } = req.query;
  const [lat, lng] = location.split(',');
  // personalize by Cookie
  const dummyLocations = [
    {lat: 0.005, lng: 0},
    {lat: 0.005, lng: 0.005},
    {lat: 0, lng: 0.01},
    {lat: -0.005, lng: 0.005},
    {lat: -0.005, lng: 0},
    {lat: -0.005, lng: -0.005},
    {lat: 0, lng: -0.01},
    {lat: 0.005, lng: -0.005},
  ];
  const services = [...Array(7)].map((_, i) => ({
    sid: i + 1,
    name: `お店の名前 ${i+1}`,
    serviceType: i % 2 ? '美容室' : '美容・整体',
    afterSec: i === 0 ? 10 : (i < 3 ? 299 : 30 * 60), // todo 募集終了時刻のタイムスタンプに
    price: i < 3 ? 3000 : 5000,
    discount: i < 4 ? 0.5 : 0.8,
    image: `./images/sample${i+1}.jpg`,
    lat: parseFloat(lat) + dummyLocations[i%8].lat,
    lng: parseFloat(lng) + dummyLocations[i%8].lng,
  }));
  res.json(services);
});
app.post('/webhook', async (req, res) => {
  // todo for dev
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('No setting environments: LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET');
    return res.status(500).json({});
  }
  const lineHmac = crypto.createHmac('sha256', lineChannelSecret);
  console.log('headers', JSON.stringify(req.headers));
  console.log('body', JSON.stringify(req.body));
  const signature = lineHmac.update(JSON.stringify(req.body)).digest('base64');
  if (signature !== req.headers['x-line-signature']) {
    console.error('invalid request');
    return res.status(400).json({});
  }
  const {events, destination} = req.body;
  for (const e of events) {
    if (!e.replyToken) {continue;}
    const body = {
      replyToken: e.replyToken,
      messages: [{type: 'text', text: 'これはWebhookからの返信です'}],
    };
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': lineAuthorization,
    };
    fetch(replyUrl, {
      method: 'post',
      timeout: reqestTimeout,
      body: JSON.stringify(body),
      headers,
    }).then(res => {
      console.log(res.status);
      console.log(res.headers.raw());
      return res.json();
    }).then(console.log);
  }
  return res.status(200).json({});
});

// 404
app.use(async (req, res) => {
  res.status(404);
  res.send({error: {message: 'Not Found'}});
});
// error handler based on Nodejs Errors
app.use((e, req, res, next) => {
  console.error(e);
  res.status(400);
  res.send({});
});

const server = app.listen(process.env.PORT || 8080, function () {
  console.log('Your app is listening on port ' + server.address().port);
});
