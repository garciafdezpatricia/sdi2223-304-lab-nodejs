var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

let app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
require("./routes/authors.js")(app); // controlador para autores

const { MongoClient } = require("mongodb"); // para poder acceder a mongo
// url de conexion
const url = 'mongodb+srv://admin:PL0G7I6cEIC1smJC@musicstoreapp.bflh7ay.mongodb.net/?retryWrites=true&w=majority';
app.set('connectionStrings', url); // almacenar cadena de conexion
require("./routes/songs.js")(app, MongoClient);

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
app.use('/users', usersRouter);


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
