/* eslint-disable @typescript-eslint/ban-ts-comment */
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
const server = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string().min(1) : z.string().url()
  ),
  // Add `.min(1) on ID and SECRET if you want to make sure they're not empty
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  EMAIL_SERVER_HOST: z.string(),
  EMAIL_SERVER_PORT: z.string(),
  EMAIL_SERVER_USER: z.string(),
  EMAIL_SERVER_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PRODUCT_ID: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  AWS_ACCESS_KEY: z.string(),
  AWS_SECRET_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
  REPLICATE_TOKEN: z.string(),
  REPLICATE_TRAINING_FINISHED_WEBHOOK: z.string(),
  REPLICATE_AVATARS_GENERATED_WEBHOOK: z.string(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z.object({
  // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js
 * edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRODUCT_ID: process.env.STRIPE_PRODUCT_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  REPLICATE_TOKEN: process.env.REPLICATE_TOKEN,
  REPLICATE_TRAINING_FINISHED_WEBHOOK:
    process.env.REPLICATE_TRAINING_FINISHED_WEBHOOK,
  REPLICATE_AVATARS_GENERATED_WEBHOOK:
    process.env.REPLICATE_AVATARS_GENERATED_WEBHOOK,
};

// Don't touch the part below
// --------------------------

const merged = server.merge(client);
/** @type z.infer<merged>
 *  @ts-ignore - can't type this properly in jsdoc */
let env = process.env;

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined";

  const parsed = isServer
    ? merged.safeParse(processEnv) // on server we can validate all env vars
    : client.safeParse(processEnv); // on client we can only validate the ones that are exposed

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  /** @type z.infer<merged>
   *  @ts-ignore - can't type this properly in jsdoc */
  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        );
      /*  @ts-ignore - can't type this properly in jsdoc */
      return target[prop];
    },
  });
}

export { env };
