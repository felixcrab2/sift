import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER!,
    amount: 500,
  },
  daily: {
    name: 'Daily',
    priceId: process.env.STRIPE_PRICE_DAILY!,
    amount: 900,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO!,
    amount: 1900,
  },
} as const

export type PlanKey = keyof typeof PLANS
