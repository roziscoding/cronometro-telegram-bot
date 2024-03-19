import "@std/dotenv/load";
import { z } from "zod";

export const AppConfig = z.object({
  TELEGRAM_TOKEN: z.string(),
  OPENAI_API_KEY: z.string()
});

export const appConfig = AppConfig.parse(Deno.env.toObject());

export type AppConfig = z.infer<typeof AppConfig>;
