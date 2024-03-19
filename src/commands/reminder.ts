import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";
// @deno-types="npm:@types/luxon"
import { DateTime } from "luxon";
import { addToAllScopes } from "../helpers/commands.ts";

export default (commands: Commands<Context>, kv: Deno.Kv) =>
  addToAllScopes(
    commands.command("reminder", "Creates a reminder for a specific date and time"),
    async (ctx) => {
      const quotedMessage = ctx.message!.reply_to_message;

      const text = ctx.message!.text!.replace("/reminder ", "");

      const date = DateTime.fromFormat(text, "dd/MM/yyyy HH:mm");

      if (!date.isValid) {
        return ctx.reply("Invalid date and time! Use format dd/MM/yyyy HH:mm. Example: 01/01/2022 13:00");
      }

      const delay = date.diffNow().as("milliseconds");

      if (delay < 0) {
        return ctx.reply("The date and time must be in the future!");
      }

      const time = DateTime.now().plus({ milliseconds: delay }).toFormat("dd/MM/yyyy HH:mm");

      const reminder = {
        chatId: ctx.chat?.id,
        messageId: quotedMessage?.message_id,
      };

      await kv.enqueue(reminder, { delay });

      await ctx.reply(`Reminder set for ${time}!`);
    },
  );
