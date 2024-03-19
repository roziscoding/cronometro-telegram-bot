import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";
import { addToAllScopes } from "../helpers/commands.ts";
import { ms, parseTime } from "../helpers/time.ts";

export default (commands: Commands<Context>, kv: Deno.Kv) =>
  addToAllScopes(commands.command("remindme", "Sets a new reminder"), async (ctx) => {
    if (!ctx.from) return;
    if (!ctx.message?.reply_to_message) {
      return ctx.reply("You need to reply to a message to use this command!");
    }

    const quotedMessage = ctx.message!.reply_to_message;

    const isBlocked = await kv.get([ctx.from.id.toString()]).then(({ value }) => Boolean(value));

    if (isBlocked) return;

    const time = ctx.message!.text!.replace("/remindme ", "");
    const msTime = ms(parseTime(time));

    if (!msTime) {
      return ctx.reply("Invalid time!");
    }

    const reminder = {
      chatId: ctx.chat?.id,
      messageId: quotedMessage?.message_id,
    };

    await kv.enqueue(reminder, { delay: msTime });

    await ctx.reply(`Reminder set for ${time}!`);
  });
