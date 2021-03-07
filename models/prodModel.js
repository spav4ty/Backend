const mongoose = require('mongoose');
const slugify = require('slugify');

const prodSchema = new mongoose.Schema({
  publisher: String,
  slug: String,
  difficulty: String,
  ingredients: [{
    quantity: Number,
    unit: String,
    description: String
  }],
  source_url: String,
  image_url: String,
  title: String,
  servings: Number,
  cooking_time: Number,
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 500
  },
  secretProduct: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },

  // reviews: [
  //   {
  //     type: mongoose.Schema.ObjectId,
  //     ref: 'Review',
  //   }
  // ]
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true}
}
);

prodSchema.index({'$title $publisher $difficulty': 'text'});
prodSchema.index({  ratingsAverage: 1 });
// prodSchema.virtual('difficulty').get(function(){
  // // return this.cooking_time >= 75 ? 'difficult' : this.cooking_time >= 30 ? 'medium': 'easy';
// })

prodSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

prodSchema.pre('save', function(next){
  this.difficulty = this.cooking_time >= 75 ? 'difficult' : this.cooking_time >= 30 ? 'medium': 'easy';
  next()
})

prodSchema.pre('save', function(next){
  this.slug = slugify(this.title, {lower: true})
  console.log(this );
  next()
})

// query Middleware
prodSchema.pre(/^find/, function(next){
  this.find({
    secretProduct: { $ne: true}
  });
  next()
})

// prodSchema.pre(/^find/, function(next){
//   this.populate('reviews');
//   next()
// })



// prodSchema.pre('aggregate', function(next){
//   console.log(this.pipeline())
//   next()
// })

const Product = mongoose.model('Product', prodSchema)

module.exports = Product;