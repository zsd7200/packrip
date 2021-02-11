// import libraries
const path = require('path');
const express = require('express');
const axios = require('axios');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const favicon = require('serve-favicon');
const compression = require('compression');
const expressHandlebars = require('express-handlebars');

// require dotenv if not production build
const dotenv = (process.env.NODE_ENV !== 'prod') ? require('dotenv') : null;

// if dotenv isn't null, run config
if (dotenv !== null) dotenv.config();

// set port and require router
const port = process.env.PORT || process.env.NODE_PORT || 3000;
const router = require('./router.js');

// api key
const key = process.env.API_KEY || '';

// fill out setIDs
const setData = {};
const getSetData = () => {
  const reqOptions = {
    method: 'GET',
    url: 'https://api.pokemontcg.io/v2/sets',
    headers: {
      'x-api-key': key,
    },
  };

  axios(reqOptions)
    .then((response) => {
      for (let i = 0; i < response.data.data.length; i++) {
        setData[response.data.data[i].id] = response.data.data[i].name;
      }
    })
    .catch((err) => { console.log(err); });
};
getSetData();

// setup express page
app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
app.use(favicon(`${__dirname}/../hosted/img/favicon.webp`));
app.disable('x-powered-by');
app.use(compression());
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);

router(app);

// networking via socket.io!
io.on('connection', (socket) => {
  // on connection, emit start to save IDs
  // small timeout to ensure the client is ready
  setTimeout(() => { socket.emit('start', JSON.stringify(setData)); }, 300);

  // sends a JSON set of cards to client, which is stored in localstorage
  socket.on('get-set', (setID) => {
    const reqOptions = {
      method: 'GET',
      url: `https://api.pokemontcg.io/v2/cards?q=set.id:${setID}`,
      headers: {
        'x-api-key': key,
      },
    };

    axios(reqOptions)
      .then((response) => { socket.emit('get-set', response.data.data, setID); })
      .catch((err) => { socket.emit('error', err); });
  });
});

http.listen(port, (err) => {
  if (err) {
    throw err;
  }

  console.log(`Listening on port ${port}`);
});
