// Products routes for the front end
import { Router } from 'express';
import fetch from 'node-fetch';
import injectUser from '../../middleware/injectUser.js';

const router = new Router();

// Index products page. Browse all available products. Pagination implemented
router.route('/').get(injectUser, async (req, res) => {
  res.render('home/playground.ejs', { user: req.user });
});
// Individual product page. We query nutritionix using req.params.product for a product, then display its information
router.route('/:product').get(injectUser, async (req, res) => {
  const product = req.params.product;
  let result;
  try {
    result = await fetch(
      `https://trackapi.nutritionix.com/v2/search/item?upc=${product}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': process.env.NUTRITIONIX_APP_ID2,
          'x-app-key': process.env.NUTRITIONIX_APP_KEY2,
          'x-remote-user-id': 0,
        },
      }
    );
    if (result.status === '404') throw new Error('Product not found');
    result = await result.json();
    if (!result.foods) throw new Error("I don't know what went wrong");
  } catch (e) {
    if ((e.message = 'Product not found')) return res.render('product/404.ejs');
    console.error('Error getting product page', e);
    return res.redirect('back');
  }

  console.log(result.foods[0]);
  // let result = {
  //   food_name: 'Beef Jerky, Chipotle Adobo',
  //   brand_name: 'Three Jerks',
  //   serving_qty: 1,
  //   serving_unit: 'oz',
  //   serving_weight_grams: 28,
  //   nf_calories: 100,
  //   nf_total_fat: 3,
  //   nf_saturated_fat: 1,
  //   nf_cholesterol: 30,
  //   nf_sodium: 350,
  //   nf_total_carbohydrate: 8,
  //   nf_dietary_fiber: 1,
  //   nf_sugars: 6,
  //   nf_protein: 10,
  //   nf_potassium: null,
  //   nf_p: null,
  //   full_nutrients: [
  //     { attr_id: 203, value: 10 },
  //     { attr_id: 204, value: 3 },
  //     { attr_id: 205, value: 8 },
  //     { attr_id: 208, value: 100 },
  //     { attr_id: 269, value: 6 },
  //     { attr_id: 291, value: 1 },
  //     { attr_id: 301, value: 26 },
  //     { attr_id: 303, value: 1.44 },
  //     { attr_id: 307, value: 350 },
  //     { attr_id: 318, value: 300 },
  //     { attr_id: 401, value: 0 },
  //     { attr_id: 601, value: 30 },
  //     { attr_id: 605, value: 0 },
  //     { attr_id: 606, value: 1 },
  //   ],
  //   nix_brand_name: 'Three Jerks',
  //   nix_brand_id: '551af50449bbebc5780a61b0',
  //   nix_item_name: 'Beef Jerky, Chipotle Adobo',
  //   nix_item_id: '5556515436f95593518aa94e',
  //   metadata: {},
  //   source: 8,
  //   ndb_no: null,
  //   tags: null,
  //   alt_measures: null,
  //   lat: null,
  //   lng: null,
  //   photo: {
  //     thumb:
  //       'https://nutritionix-api.s3.amazonaws.com/555652c40761f2ce5d7e076d.jpeg',
  //     highres: null,
  //     is_user_uploaded: false,
  //   },
  //   note: null,
  //   class_code: null,
  //   brick_code: null,
  //   tag_id: null,
  //   updated_at: '2019-01-27T10:39:22+00:00',
  //   nf_ingredient_statement:
  //     'Beef, Water, Sugar, Less than 2% Salt, Corn Syrup Solids, Dried Soy Sauce (Soybeans, Salt, Wheat), Hydrolyzed Corn and Soy Protein, Monosodium Glutamate, Maltodextrin, Flavorings, Sodium Erythorbate, Sodium Nitrite.',
  // };
  let dailyValue = {
    sugar: 100,
    fat: 65,
    saturated_fat: 20,
    cholesterol: 300,
    sodium: 2400,
    carbs: 300,
    fibre: 25,
    vitaminA: 1000,
    vitaminC: 60,
    calcium: 1100,
    iron: 14,
  };
  res.render('products/product.ejs', {
    user: req.user,
    product: result.foods[0],
    // product: result,
    dailyValue,
  });
});

export default router;
