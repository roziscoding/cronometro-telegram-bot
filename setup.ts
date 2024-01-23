import { bot, myCommands } from "./bot.ts";
import { appConfig } from "./config.ts";

await bot.api.setWebhook(appConfig.WEBHOOK_URL);

await myCommands.setCommands(bot);
console.log(JSON.stringify(myCommands.toJSON(), null, 2));
