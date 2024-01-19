import "std/dotenv/load.ts";
import { z } from "./deps.ts";

export const AppConfig = z.object({
  TELEGRAM_TOKEN: z.string(),
});

export const appConfig = AppConfig.parse(Deno.env.toObject());

export type AppConfig = z.infer<typeof AppConfig>;
