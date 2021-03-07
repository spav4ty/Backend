const mongoose = require('mongoose')
const Product = require('./prodModel')
const uniqueValidator = require('mongoose-unique-validator');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can not be empty!']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }, 
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, "Review must belong to a tour."]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user.']
  },
},
{
  toJSON: { virtuals: true },
  toObject: {virtuals: true }
}
);

reviewSchema.index({ 'product': 1, 'user': 1 }, { unique: true, dropDups: true });

// reviewSchema.ensureIndex({ 'product': 1, 'user': 1 }, { unique: true, dropDups: true })

reviewSchema.plugin(uniqueValidator, {
  message : 'Name must be unique.'
})

reviewSchema.pre(/^find/, function(next){ 
  this.populate({
    path: "user",
    select: "name photo"
  })
  next()
})

reviewSchema.statics.calcAverageRatings = async function(prodId) {
  // console.log(prodId);
  const stats = await this.aggregate([
    {
      $match: { product: prodId },
    },
    {
      $group: { 
        _id: '$product',
        nRating: { $sum:1 },
        avgRating: {$avg: '$rating'}
      }
    },
  ]);
  if(stats.length > 0) {
    await Product.findByIdAndUpdate(prodId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  } else {
    await Product.findByIdAndUpdate(prodId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.pre(/^findOneAnd/, async function(next){
  this.r = await this.findOne();
  console.log('Tut poluchaem this.r',this.r)
  next()
});

reviewSchema.post(/^findOneAnd/, async function(){
  await this.r.constructor.calcAverageRatings(this.r.product)
  console.log(this.r.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// Review.ensureIndexes(function (err) {
//   console.log('ENSURE INDEX')
//   if (err) console.log(err)
// })

// Review.on('index', function (error) {
//   console.log("ON INDEX")
//   if (error) console.log(error)
// })