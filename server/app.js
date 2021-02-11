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

// set IDs from TCG API
const setIDs = ['base1', 'base2', 'basep', 'base3', 'base4', 'base5', 'gym1', 'gym2', 'neo1', 'neo2', 'si1', 'neo3', 'neo4', 'base6', 'ecard1', 'ecard2', 'ecard3', 'ex1', 'ex2', 'ex3', 'np', 'ex4', 'ex5', 'ex6', 'pop1', 'ex7', 'ex8', 'ex9', 'ex10', 'pop2', 'ex11', 'ex12', 'pop3', 'ex13', 'ex14', 'pop4', 'ex15', 'pop5', 'ex16', 'dp1', 'dpp', 'dp2', 'pop6', 'dp3', 'dp4', 'pop7', 'dp5', 'dp6', 'pop8', 'dp7', 'pl1', 'pop9', 'pl2', 'pl3', 'pl4', 'ru1', 'hgss1', 'hsp', 'hgss2', 'hgss3', 'hgss4', 'col1', 'bwp', 'bw1', 'bw2', 'bw3', 'bw4', 'bw5', 'bw6', 'dv1', 'bw7', 'bw8', 'bw9', 'bw10', 'xyp', 'bw11', 'xy0', 'xy1', 'xy2', 'xy3', 'xy4', 'xy5', 'dc1', 'xy6', 'xy7', 'xy8', 'xy9', 'g1', 'xy10', 'xy11', 'xy12', 'sm1', 'smp', 'sm2', 'sm3', 'sm35', 'sm4', 'sm5', 'sm6', 'sm7', 'sm75', 'sm8', 'sm9', 'det1', 'sm10', 'sm11', 'sm115', 'sma', 'sm12', 'swsh1', 'swsh2', 'swsh3', 'swsh35', 'swshp', 'swsh4', 'mcd11', 'mcd12', 'mcd16', 'mcd19'];

// api key
const key = process.env.API_KEY || '';

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
  socket.emit('start', setIDs);

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
      .then((response) => { socket.emit('get-set', response.data, setID); })
      .catch((err) => { socket.emit('error', err); });
  });
});

http.listen(port, (err) => {
  if (err) {
    throw err;
  }

  console.log(`Listening on port ${port}`);
});
