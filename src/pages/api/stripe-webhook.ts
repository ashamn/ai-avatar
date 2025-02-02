import { NextApiRequest, NextApiResponse } from "next";
import type { Readable } from "node:stream";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { prisma } from "@/server/db";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const stripeWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const rawBody = buf.toString("utf-8");
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("signature not present");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    const data: any = event.data.object;
    if (event.type === "charge.succeeded" && data.billing_details.email) {
      await prisma.user.update({
        where: {
          email: data.billing_details.email,
        },
        data: {
          isPaymentSucceeded: true,
          modelTrainingLimit: 1,
        },
      });
    }

    return res.status(200).send("success");
  } else {
    res.setHeader("ALLOW", "POST");
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default stripeWebhook;
