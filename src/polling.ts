import { z } from "zod";
import { bot, kv } from "./bot.ts";

await bot.start({
  onStart: ({ username }) => {
    console.log(`Listening as @${username}`);
  },
});

kv.listenQueue(async (data) => {
  console.log(`Received reminder: ${data}`);
  const parsedData = z.object({
    chatId: z.number(),
    messageId: z.number().optional(),
    message: z.string().optional().default("Reminder!"),
  }).safeParse(data);

  if (!parsedData.success) return;

  const reminder = parsedData.data;

  await bot.api.sendMessage(
    reminder.chatId,
    reminder.message,
    {
      reply_parameters: (
        reminder.messageId ? { message_id: reminder.messageId, allow_sending_without_reply: false } : undefined
      ),
    },
  ).catch(console.error);
});
