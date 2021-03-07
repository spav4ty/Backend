const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const APIFeatures = require('../utils/apiFeatures.js')


exports.getAll = Model => catchAsync(async (req, res, next) => {
  // This for Reivew in Products   (hack)
  let filter = {}
  if(req.params.prodId) filter = {product: req.params.prodId}
// -------------------------------------------------------------
  const features = new APIFeatures(Model, req.query, filter)
  .filter()
  .search()
  .sort()
  .limitFields()
  .paginate()

  const doc = await features.query;

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data:doc
    } 
  });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  console.log('S');
    let query = Model.findById(req.params.id)
    if(popOptions) query =  query.populate(popOptions);
    const doc = await query;  
  // console.log(doc);
    if(!doc) {
      return next(new AppError('No document found with that ID', 404))
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        data:doc
      }
    });
  });


exports.createOne = Model => catchAsync(async (req, res) => {
  const newDoc = await Model.create(req.body)
  // console.log(newTour)
  res.status(201).json({
    status: 'success',
      data: {
        data: newDoc
      }
  });
});

exports.updateOne = Model =>  catchAsync(async(req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });


  if(!doc) {
    return next(new AppError('No document found with that ID', 404))
  } 

  res.status(200).json({
    status: 'success',
    data: {
      data:doc
    }
  });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);
  
  if(!doc) {
    return next(new AppError('No document found with that ID', 404))
  }
    
  res.status(200).json({
    status: 'success',
    data: null
  });
});
