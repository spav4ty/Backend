const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory')

exports.getAllReview = factory.getAll(Review)

exports.getReview = factory.getOne(Review)

exports.setProductUserIds =(req, res, next) =>  {
  if(!req.body.product) req.body.product = req.params.prodId;
  if(!req.body.user) req.body.user = req.user.id;
  console.log(req.params);
console.log(req.body);
  next()
}

exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)