import Stripe from "stripe";

/**
 * Server-side Stripe client.
 * Only import this in Server Components, Route Handlers, or Server Actions.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
