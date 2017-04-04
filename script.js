var dbconfig = require('./db_config');
var express = require('express');
const pgp = require('pg-promise')({
   promiseLib: Promise
 });
var db = pgp(dbconfig);
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
var bluebird = require('bluebird');
var hbs = require('hbs');
app.set('view engine', 'hbs');
app.use(express.static('public'));



app.get ('/' , function(req, res) {
     res.render('form.hbs', {
          title: 'search'
     });
});
app.get ('/search', function(req, res) {
     let searchTerm= req.query.food;
     db.any(`
          select * from restaurant
          where restaurant.category ilike '%${searchTerm}%' or
               restaurant.name ilike '%${searchTerm}%'
          `)

     .then(function(result){
          console.log(result);
          res.render('result.hbs',{
               result: result
          });
     })
     .catch(function(err){
          console.log(err.message);
     });


});
app.get('/restaurant/:id', function(req, resp, next) {
  let id = req.params.id;
  db.any(`
    select
     restaurant.id,
      restaurant.name as restaurant_name,
      restaurant.address,
      restaurant.category,
      reviewer.name as reviewer_name,
      review.title,
      review.stars,
      review.review
    from
      restaurant
    left outer join
      review on review.restaurant_id = restaurant.id
    left outer join
      reviewer on review.reviewer_id = reviewer.id
    where restaurant.id = ${id}
  `)
    .then(function(reviews) {
      console.log('reviews', reviews);
      resp.render('restaurant.hbs', {
        restaurant: reviews[0],
        reviews: reviews,
        hasReviews: reviews[0].reviewer_name
      });
    })
    .catch(next);
});
app.post('/submit/:id', function(req, res, next){
     var restaurantId = req.params.id;
     db.none(
          `insert into review values (default, NULL, '${req.body.stars}', '${req.body.title}', '${req.body.review}', ${restaurantId})`)
     .then(function(){
          res.redirect(`/restaurant/${restaurantId}`);

     })
     .catch(next);
});



app.listen(3000, function () {

});
