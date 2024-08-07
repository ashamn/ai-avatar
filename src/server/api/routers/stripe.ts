import Stripe from "stripe";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "@/env.mjs";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export const stripeRouter = createTRPCRouter({
  checkout: protectedProcedure.mutation(async () => {
    const productData = await stripe.products.retrieve(env.STRIPE_PRODUCT_ID);

    if (!productData.default_price) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "something went wrong with strip",
      });
    }

    // checkout session

    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: productData.default_price.toString(),
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.NEXTAUTH_URL}/?success=true`,
      cancel_url: `${env.NEXTAUTH_URL}/?canceled=true`,
    });

    return { checkoutUrl: checkoutSession.url };
  }),
  getPaymentStatus: protectedProcedure.query(
    async ({ ctx: { prisma, session } }) => {
      return prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          isPaymentSucceeded: true,
        },
      });
    }
  ),
});
