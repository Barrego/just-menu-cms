/**
 * price service
 */

import { factories } from "@strapi/strapi";
import axios from "axios";

export const getPrice = async (
  priceId: number,
  urlProduct: string
): Promise<{ priceId: number; price: number }> => {
  const price =
    ((await axios.get(urlProduct)).data?.price_instructions
      ?.bulk_price as number) || 0;
  return {
    priceId,
    price,
  };
};

export default factories.createCoreService("api::price.price", () => ({
  async find(...args) {
    const { results, pagination } = await super.find(...args);

    const urlPricesPromises: Promise<{ priceId: number; price: number }>[] = [];

    results.forEach((price) => {
      if (price.urlProduct) {
        urlPricesPromises.push(getPrice(price.id, price.urlProduct));
      }
    });

    const urlPrices = await Promise.all(urlPricesPromises);

    const newResutls = results.map((price) => {
      const urlPrice = urlPrices.find(
        (urlPrice) => urlPrice.priceId === price.id
      );

      return {
        ...price,
        amount: urlPrice?.price || price.amount,
      };
    });

    return { results: newResutls, pagination };
  },
}));
