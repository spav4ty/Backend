const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cors = require('cors')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const prodRouter = require('./routes/prodRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouter')

const app = express();

app.use(cors())
// 1) MIDDLEWARES
// set security HTTP headers
app.use(helmet())
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Слишком много запросов с этого IP-адреса, повторите попытку через час!'
})
app.use('/api',limiter)

// Body parser, rending data from body into req.body 
app.use(express.json({ limit: '10kb'}));

// Data sanitization against NoSQL query injection 
app.use(mongoSanitize())
// Data sanitization against XSS
app.use(xss())
// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration'
  ]
}))

// app.use((req,res,next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// })


// Serving static files
app.use(express.static(`${__dirname}/frontend/dist`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/products', prodRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req,res,next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`)
  // err.status = 'fail';
  // err.statusCode = 404;
  // console.log(err);
  // next(err)
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

module.exports = app;
