const Product = require('../models/prodModel.js')
const catchAsync = require('../utils/catchAsync.js')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.getDifficulty = (req,res,next) => {
  req.query.limit = '5';
  req.query.sort = 'difficulty';
  req.query.fields = 'title,difficulty,publisher,cooking_time,image_url,ingredients';
  next()
}



exports.getAllProds = factory.getAll(Product)
exports.getProd = factory.getOne(Product, {path:'reviews'})

exports.createProd = factory.createOne(Product)
exports.updateProd = factory.updateOne(Product)
exports.deleteProd = factory.deleteOne(Product)

// exports.deleteProd = catchAsync(async (req, res) => {
//   const product = await Product.findByIdAndDelete(req.params.id);
  
//   if(!product) {
//     return next(new AppError('No Product found with that ID', 404))
//   }
    
//   res.status(200).json({
//     status: 'success',
//     data: null
//   });
// })

exports.getProductSearch = catchAsync(async(req,res, next) => {
  
  const search = await Product.aggregate([
    {
      $match: { $text: {$search:"egg"} }
    },
    {
      $project: {
        title : 1,
        cooking_time: 1,
        difficulty: 1,
        image_url: 1,
        price: 1,
        publisher: 1,
        ratingsAverage: 1,
        ratingsQuantity: 1,
        secretProduct: 1,
        servings: 1,
        slug: 1,
        source_url: 1,
      }
    }
  ]);
  console.log(search);
  res.status(200).json({
    status: 'success',
    data: {
      search
    }
  });
})

exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numProducts: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);
  console.log(stats);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
})