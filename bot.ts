import { appConfig } from "./config.ts";
import { grammy, ms, z } from "./deps.ts";

const kv = await Deno.openKv();
const bot = new grammy.Bot(appConfig.TELEGRAM_TOKEN);

bot.command("block", async (ctx) => {
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

bot.command("unblock", async (ctx) => {
  const quotedMessage = ctx.message?.reply_to_message;

  if (!quotedMessage) {
    return ctx.reply("You need to reply to a message to use this command!");
  }

  if (!quotedMessage.from) {
    return ctx.reply("You can only unblock users!");
  }

  await kv.delete([quotedMessage.from.id.toString()]);

  await ctx.reply(`${quotedMessage.from.first_name} unblocked!`);
});

bot.command("remindme", async (ctx) => {
  if (!ctx.from) return;
  if (!ctx.message?.reply_to_message) {
    return ctx.reply("You need to reply to a message to use this command!");
  }

  const quotedMessage = ctx.message.reply_to_message;

  const isBlocked = await kv.get([ctx.from.id.toString()]).then(({ value }) => Boolean(value));

  if (isBlocked) return;

  const time = ctx.message.text.split(" ").slice(1).join("");
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

const handleUpdate = grammy.webhookCallback(bot, "std/http");

Deno.serve({
  onListen: ({ port }) => {
    console.log(`Listening on port ${port}`);
  },
}, async (req) => {
  if (req.method === "POST") {
    const url = new URL(req.url);
    if (url.pathname.slice(1) === bot.token) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    }
  }
  return new Response();
});

kv.listenQueue(async (data) => {
  const parsedData = z.object({
    chatId: z.number(),
    messageId: z.number(),
  }).safeParse(data);

  if (!parsedData.success) return;

  const reminder = parsedData.data;

  await bot.api.sendMessage(reminder.chatId, "Reminder!", {
    reply_parameters: {
      message_id: reminder.messageId,
      allow_sending_without_reply: false,
    },
  }).catch(console.error);
});
