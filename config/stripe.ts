export const stripeConfig = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  proPlanPriceId: process.env.EXPO_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  // Backend URL where you will host your checkout session creation endpoint
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
};