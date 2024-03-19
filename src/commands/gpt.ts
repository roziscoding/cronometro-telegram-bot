import { addReplyParam } from "@grammyjs/autoquote";
import { Commands } from "@grammyjs/commands";
import "@std/dotenv/load";
import { Context } from "grammy";
import { OpenAI } from "openai";
// @deno-types="npm:@types/luxon"
import { DateTime, Duration, Settings } from "luxon";
import { appConfig } from "../config.ts";
import { addToAllScopes } from "../helpers/commands.ts";

Settings.defaultZone = "America/Sao_Paulo";

const calls = new Map<string, string>();
const openai = new OpenAI({ apiKey: appConfig.OPENAI_API_KEY });

export default (commands: Commands<Context>, kv: Deno.Kv) => {
  addToAllScopes(commands.command("gpt", "Talk to the AI"), (ctx) => {
    ctx.api.config.use(addReplyParam(ctx as any) as any);
    if (!ctx.message?.text) return;
    const quotedMessage = ctx.message.reply_to_message;

    return openai.beta.chat.completions.runTools({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.
            When asked to set a reminder, use the message provided by ther user or an empty string.
            When returning dates, always return the date in exact terms. For example, instead of "tomorrow at 5pm", say "21/03/2024 27:00"
            When setting a reminder, always say for what date and time it was set.
            Be as brief as possible.
          `,
        },
        { role: "user", content: ctx.message.text.replace("/gpt", "").trim() },
      ],
      tools: [
        {
          type: "function",
          function: {
            parse: JSON.parse,
            function: async ({ date, message: text }: { date: string; message: string }) => {
              const reminder = {
                chatId: ctx.chat?.id,
                messageId: quotedMessage?.message_id,
                message: text,
              };

              const msTime = DateTime.fromISO(date).diffNow().toMillis();

              if (msTime < 0) {
                return { success: false, message: "Date and time must be in the future" };
              }

              await kv.enqueue(reminder, { delay: msTime });
              return { succes: true, reminderTime: DateTime.now().plus(Duration.fromMillis(msTime)).toISO() };
            },
            name: "setReminder",
            description: "Set a reminder for a specific date and time.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", format: "date-time" },
                message: { type: "string" },
              },
              required: ["date", "message"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "getCurrentDate",
            description: "Get the current date and time.",
            function: () => {
              return DateTime.now().toISO();
            },
            parameters: {},
          },
        },
      ],
    })
      .on("message", async (msg) => {
        if (msg.role === "tool") {
          console.log(`[${msg.role}] Tool ${calls.get(msg.tool_call_id)} returned ${msg.content}`);
          calls.delete(msg.tool_call_id);
        }
        if (msg.role === "system") return;
        if (msg.role === "user") return;
        if (!msg.content && msg.role === "assistant" && msg.tool_calls) {
          msg.tool_calls.forEach((call) => {
            calls.set(call.id, call.function.name);
            console.log(
              `[${msg.role}] Calling ${call.function.name} with params ${call.function.arguments}`,
            );
          });
          return;
        }
        if (msg.role === 'assistant' && msg.content) await ctx.reply(msg.content);
        console.log(`[${msg.role}] ${msg.content}`);
      });
  });
};
