import { getUncachableStripeClient } from '../server/stripeClient';

async function seedStripeProducts() {
  console.log('Creating Stripe products and prices...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ query: "name:'Unlimited Monthly'" });
  if (existingProducts.data.length > 0) {
    console.log('Unlimited Monthly product already exists:', existingProducts.data[0].id);
    const existingPrices = await stripe.prices.list({ product: existingProducts.data[0].id });
    console.log('Existing price:', existingPrices.data[0]?.id);
    return;
  }

  const product = await stripe.products.create({
    name: 'Unlimited Monthly',
    description: 'Unlimited lesson generation per month',
    metadata: {
      planType: 'subscription',
      tier: 'unlimited'
    }
  });
  console.log('Created product:', product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      planId: 'unlimited_monthly'
    }
  });
  console.log('Created price:', price.id);

  console.log('\nUpdate your routes.ts with this price ID:');
  console.log(`'price_unlimited_monthly': '${price.id}'`);
}

seedStripeProducts().catch(console.error);
