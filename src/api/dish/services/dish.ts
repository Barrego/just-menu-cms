/**
 * dish service
 */

import { factories } from "@strapi/strapi";

import { getPrice } from "../../price/services/price";

export default factories.createCoreService("api::dish.dish", () => ({
  async findOne(entityId, params) {
    const dish = await super.findOne(entityId, this.getFetchParams(params));

    const urlPricesPromises: Promise<{ priceId: number; price: number }>[] = [];

    dish.ingredient_quantities.forEach((ingredientQuantity) => {
      ingredientQuantity.ingredient.prices.forEach((price) => {
        if (price.urlProduct) {
          urlPricesPromises.push(getPrice(price.id, price.urlProduct));
        }
      });
    });

    const urlPrices = await Promise.all(urlPricesPromises);

    const ingredient_quantities = dish.ingredient_quantities.map(
      (ingredientQuantity) => {
        const newIngredient = { ...ingredientQuantity.ingredient };

        const newPrices = newIngredient.prices.map((price) => {
          const urlPrice = urlPrices.find(
            (urlPrice) => urlPrice.priceId === price.id
          );

          return {
            ...price,
            amount: urlPrice?.price || price.amount,
          };
        });

        newIngredient.prices = [...newPrices];

        return {
          ...ingredientQuantity,
          ingredient: newIngredient,
        };
      }
    );

    const newDish = {
      ...dish,
      ingredient_quantities,
    };

    return { ...newDish };
  },
}));
