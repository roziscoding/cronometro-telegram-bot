import { bot, kv } from "./bot.ts";
import { grammy, z } from "./deps.ts";

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
