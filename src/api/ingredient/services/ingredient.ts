/**
 * ingredient service
 */

import { factories } from "@strapi/strapi";

import { getPrice } from "../../price/services/price";

export default factories.createCoreService(
  "api::ingredient.ingredient",
  () => ({
    async find(...args) {
      const { results, pagination } = await super.find(...args);

      const urlPricesPromises: Promise<{ priceId: number; price: number }>[] =
        [];

      results.forEach((ingredient) => {
        ingredient.prices.forEach((price) => {
          if (price.urlProduct) {
            urlPricesPromises.push(getPrice(price.id, price.urlProduct));
          }
        });
      })

      const urlPrices = await Promise.all(urlPricesPromises);

      const newResutls = results.map((ingredient) => {
        const prices = ingredient.prices.map(price => {
          const urlPrice = urlPrices.find(
            (urlPrice) => urlPrice.priceId === price.id
          );

          return {
            ...price,
            amount: urlPrice?.price || price.amount,
          };
        })

        return {
          ...ingredient,
          prices
        };
      });

      return { results: newResutls, pagination };
    },
  })
);
