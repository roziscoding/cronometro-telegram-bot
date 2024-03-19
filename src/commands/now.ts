import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";
// @deno-types="npm:@types/luxon"
import { DateTime } from "luxon";
import { addToAllScopes } from "../helpers/commands.ts";

export default (commands: Commands<Context>) =>
  addToAllScopes(
    commands.command("now", "Shows the current date and time"),
    (ctx) => ctx.reply(DateTime.now().toFormat("dd/MM/yyyy HH:mm")),
  );
