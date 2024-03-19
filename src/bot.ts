import { Bot } from "grammy";
import { Settings } from "luxon";
import * as commands from "./commands/index.ts";
import { appConfig } from "./config.ts";

Settings.defaultZone = "America/Sao_Paulo";

export const kv = await Deno.openKv();
export const bot = new Bot(appConfig.TELEGRAM_TOKEN);

const myCommands = commands.install(kv);

bot.use(myCommands);
