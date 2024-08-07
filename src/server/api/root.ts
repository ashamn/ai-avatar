import { createTRPCRouter } from "./trpc";
import {
  stripeRouter,
  storageRouter,
  imagesRouter,
  replicateRouter,
  userRouter,
} from "./routers";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  storage: storageRouter,
  images: imagesRouter,
  replicate: replicateRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
