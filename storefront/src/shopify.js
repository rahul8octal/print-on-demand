import Client from 'shopify-buy';

export const client = Client.buildClient({
  domain: import.meta.env.VITE_SHOPIFY_DOMAIN || 'your-shop-name.myshopify.com',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || 'your-storefront-api-token'
});
