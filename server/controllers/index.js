// load index page
const indexPage = (req, res) => {
  res.render('index');
};

// load 404 page
const errPage = (req, res) => {
  res.render('err');
};

// export for use in router
module.exports.indexPage = indexPage;
module.exports.errPage = errPage;
