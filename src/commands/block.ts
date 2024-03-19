import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";

export default (myCommands: Commands<Context>, kv: Deno.Kv) =>
  myCommands
    .command("block", "Block a user from using the bot")
    .addToScope({ type: "all_chat_administrators" }, async (ctx) => {
      const quotedMessage = ctx.message?.reply_to_message;

      if (!quotedMessage) {
        return ctx.reply("You need to reply to a message to use this command!");
      }

      if (!quotedMessage.from) {
        return ctx.reply("You can only block users!");
      }

      await kv.set([quotedMessage.from.id.toString()], true);

      await ctx.reply(`${quotedMessage.from.first_name} blocked!`);
    });
