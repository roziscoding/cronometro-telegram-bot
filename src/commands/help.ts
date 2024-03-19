import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";
import { addToAllScopes } from "../helpers/commands.ts";

export default (commands: Commands<Context>) =>
  addToAllScopes(
    commands.command("help", "Shows help message"),
    (ctx) =>
      ctx.reply(
        [
          "Hey! I'm a bot that helps you remember things!",
          "Reply to a message with <code>/remindme [time]</code> to set a reminder!",
          "For example: <code>/remindme 1h30m</code>",
        ].join("\n"),
        { parse_mode: "HTML" },
      ),
  );
