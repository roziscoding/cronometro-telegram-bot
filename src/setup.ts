import { bot, myCommands } from "./bot.ts";

const webhookUrl = Deno.env.get("WEBHOOK_URL");

if (!webhookUrl) {
  throw new Error("WEBHOOK_URL is not set");
}

await bot.api.setWebhook(webhookUrl);

await myCommands.setCommands(bot);
console.log(JSON.stringify(myCommands.toJSON(), null, 2));
