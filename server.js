const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const qs = require('querystring');

// app.set('assets', path.join(__dirname, 'assets'));
app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}));
app.use(express.static('assets'));

const memoryDB = {};

app.post('/getServices', async (req, res) => {
  const {
    id,
    here,
  } = req.body;
  const services = [...Array(9)].map((v, i) => {
    const add = Math.random() > 0.5 ? Math.random() : Math.random() * -1;
    return {
      sid: i + 1,
      name: 'お店の名前',
      serviceType: "美容・整体",
      afterMinutes: 30,
      price: 3000,
      discount: 0.8,
      image: './assets/images/sei-tai.png',
      lat: here.lat + add,
      lng: here.lng + add,
    };
  });
  console.log(services);
  res.json(services);
});

const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + server.address().port);
});