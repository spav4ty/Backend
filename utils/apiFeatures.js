class APIFeatures {
  constructor(query, queryString, params){
    this.query = query;
    this.queryString = queryString;
    this.params = params;
  }

  filter(){    
    const queryObj = {...this.queryString}; 
    const excludedFields = ['search','page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    
    let queryStr = JSON.stringify(queryObj)
    queryStr = JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`));

    if(!this.queryString.search){
      this.query.find(this.params);
      this.query = this.query.find(queryStr);
    } else {
      this.query = this.query;
    }
    
    // let query = Product.find(JSON.parse(queryStr))
    // console.log(this);
    return this
  }

  search(){
   if(this.queryString.search){
    const searchBy = this.queryString.search.split(',').join(' ')
    // this.query = this.query.sort(sortBy)
    this.query = this.query.aggregate([
      {
        $match: { $text: {$search:searchBy} }
      },
      {
        $project: {
          title : 1,
          id: '$_id',
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
   } 
   return this;
  }

  sort(){
    if(this.queryString.search) return this;
    if(this.queryString.sort){
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)

    } else {
      this.query = this.query.sort('-createdAt')
    }
    return this; 
  }

  limitFields(){
    if(this.queryString.search) return this;

    if(this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields)
    } else {
      // this.query = this.query.select('-ingredients -__v')
      this.query = this.query.select('-__v -ingredients')
    }
    return this;
  }

  paginate(){
    if(this.queryString.search) return this;
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit)
    return this;
  }
}

module.exports = APIFeatures;

 // const queryObj = {...req.query}; 
    // const excludedFields = ['page', 'sort', 'limit', 'fields']
    // excludedFields.forEach(el => delete queryObj[el] )
    // let queryStr = JSON.stringify(queryObj)
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
 
    // let query = Product.find(JSON.parse(queryStr))
    
    
    // 2)Sorting
    // if(req.query.sort){
    //   const sortBy = req.query.sort.split(',').join(' ')
    //   console.log(sortBy)
    //   query = query.sort(sortBy)
    // } else {
    //   query = query.sort('-createdAt')
    // }
    
    // // 3) Field limiting  
    // if(req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields)
    // } else {
    //   query = query.select('-ingredients -__v')
    // }
    
    // // 4) Pagination
    
    // // console.log(req.query);
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // quert = query.skip(skip).limit(limit)

    // if(req.query.page) {
    //   const numProducts = await Product.countDocuments()
    //   if(skip >= numProducts) throw new Error('This page does not exist')
    // }
    
    // const products = await query;
    // const products = await Product.find()
