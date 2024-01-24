import { appConfig } from "./config.ts";
import { commands, grammy, ms } from "./deps.ts";

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

  const time = ctx.message!.text!.split(" ").slice(1).join("");
  const msTime = ms(time);

  if (!msTime || typeof msTime !== "number" || msTime < 0) {
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

bot.use(myCommands);
