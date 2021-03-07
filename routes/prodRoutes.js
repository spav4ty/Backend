const express = require('express')
const prodController = require('../controllers/prodController')
const authController = require('../controllers/authController')
const reviewRouter = require('./reviewRouter')

const router = express.Router();


router.use('/:prodId/reviews', reviewRouter)


router.route('/difficulty').get(prodController.getDifficulty,prodController.getAllProds)

router.route('/stats').get(prodController.getProductStats)
router.route('/search').get(prodController.getProductSearch)

router
  .route('/')
  .get(prodController.getAllProds)
  .post( 
    authController.protect, 
    authController.restrictTo('user','admin','lead-guide'),
    prodController.createProd
  )

router
  .route('/:id')
  .get(prodController.getProd)
  .patch(  
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'),
    prodController.updateProd
  )
  .delete(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'),
    prodController.deleteProd
  );

 
  module.exports = router;
