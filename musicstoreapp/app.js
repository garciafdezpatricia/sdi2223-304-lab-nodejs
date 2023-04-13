var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

let app = express();

let expressSession = require('express-session');
app.use(expressSession({
  secret: 'abcdefg',
  resave: true,
  saveUninitialized: true
}))

let crypto = require('crypto');
let fileUpload = require('express-fileupload');
app.use(fileUpload({
  limits: {fileSize: 50*1024*1024},
  createParentPath: true
}));
app.set('uploadPath', __dirname);
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

let indexRouter = require('./routes');
require("./routes/authors.js")(app); // controlador para autores

const { MongoClient } = require("mongodb"); // para poder acceder a mongo
const url = 'mongodb+srv://admin:PL0G7I6cEIC1smJC@musicstoreapp.bflh7ay.mongodb.net/?retryWrites=true&w=majority';
app.set('connectionStrings', url); // almacenar cadena de conexion

const userSessionRouter = require('./routes/userSessionRouter');
const userAudiosRouter = require('./routes/userAudiosRouter');
const userAuthorRouter = require('./routes/userAuthorRouter')

app.use("/songs/add",userSessionRouter);
app.use("/publications",userSessionRouter);
app.use("/shop/",userSessionRouter);
app.use("/audios", userAudiosRouter);
app.use("/comments", userSessionRouter);
app.use("/songs/edit", userAuthorRouter);
app.use("/songs/delete", userAuthorRouter);

let commentsRepository = require("./repositories/commentsRepository.js");
commentsRepository.init(app, MongoClient);
require("./routes/comments.js")(app, commentsRepository)

let songsRepository = require("./repositories/songsRepository.js");
songsRepository.init(app, MongoClient);
require("./routes/songs.js")(app, songsRepository, commentsRepository);

const usersRepository = require("./repositories/usersRepository.js");
usersRepository.init(app, MongoClient);
require("./routes/users.js")(app, usersRepository);

// view engine setup: incluido el modulo twig en el fichero app.js
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// declare public folder as static
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
