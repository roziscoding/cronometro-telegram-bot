import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";

export default (commands: Commands<Context>) =>
  commands
    .command("start", "Say hello")
    .addToScope(
      { "type": "all_private_chats" },
      (ctx) => ctx.reply("Hey! I'm more useful when added to a group! Send /help to see my commands"),
    )
    .addToScope(
      { type: "all_group_chats" },
      (ctx) => ctx.reply("Hey! I'm ready to help! Send /help to see my commands"),
    );
