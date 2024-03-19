import * as commands from "@grammyjs/commands";
import * as grammy from "grammy";
// @deno-types="npm:@types/luxon"
import { DateTime, Settings } from "luxon";
import { appConfig } from "../src/config.ts";
import { ms, parseTime } from "../src/time.ts";

Settings.defaultZone = "America/Sao_Paulo";

export const kv = await Deno.openKv();
export const bot = new grammy.Bot(appConfig.TELEGRAM_TOKEN);
export const myCommands = new commands.Commands();

function addToAllScopes(command: ReturnType<typeof myCommands.command>, middleware: grammy.Middleware) {
  command.addToScope({ type: "default" }, middleware)
    .addToScope({ type: "all_private_chats" }, middleware)
    .addToScope({ type: "all_chat_administrators" }, middleware)
    .addToScope({ type: "all_group_chats" }, middleware);
}

myCommands.command("start", "Say hello")
  .addToScope(
    { "type": "all_private_chats" },
    (ctx) => ctx.reply("Hey! I'm more useful when added to a group! Send /help to see my commands"),
  )
  .addToScope({ type: "all_group_chats" }, (ctx) => ctx.reply("Hey! I'm ready to help! Send /help to see my commands"));

myCommands.command("block", "Block a user from using the bot")
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

myCommands.command("unblock", "Unblocks a user from using the bot")
  .addToScope(
    { type: "all_chat_administrators" },
    async (ctx) => {
      const quotedMessage = ctx.message?.reply_to_message;

      if (!quotedMessage) {
        return ctx.reply("You need to reply to a message to use this command!");
      }

      if (!quotedMessage.from) {
        return ctx.reply("You can only unblock users!");
      }

      await kv.delete([quotedMessage.from.id.toString()]);

      await ctx.reply(`${quotedMessage.from.first_name} unblocked!`);
    },
  );

addToAllScopes(myCommands.command("remindme", "Sets a new reminder"), async (ctx) => {
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

addToAllScopes(myCommands.command("help", "Shows help message"), (ctx) =>
  ctx.reply(
    [
      "Hey! I'm a bot that helps you remember things!",
      "Reply to a message with <code>/remindme [time]</code> to set a reminder!",
      "For example: <code>/remindme 1h30m</code>",
    ].join("\n"),
    { parse_mode: "HTML" },
  ));

addToAllScopes(myCommands.command("reminder", "Creates a reminder for a specific date and time"), async (ctx) => {
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
});

myCommands.command("now", "Shows the current date and time")
  .addToScope({ type: "all_chat_administrators" }, (ctx) => ctx.reply(DateTime.now().toFormat("dd/MM/yyyy HH:mm")));

bot.use(myCommands);
