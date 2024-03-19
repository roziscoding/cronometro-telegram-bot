import { addReplyParam } from "@grammyjs/autoquote";
import { Bot } from "grammy";
// @deno-types="npm:@types/luxon"
import { DateTime, Duration, Settings } from "luxon";
import OpenAI from "openai";
import { appConfig } from "./config.ts";

Settings.defaultZone = "America/Sao_Paulo";

export const kv = await Deno.openKv();
export const bot = new Bot(appConfig.TELEGRAM_TOKEN);
const calls = new Map<string, string>();
const openai = new OpenAI({ apiKey: appConfig.OPENAI_API_KEY });

// const myCommands = commands.install(kv);

// bot.use(myCommands);

bot.on("message:text")
  .filter((ctx) => ctx.hasChatType("private") || ctx.has(":entities:mention"))
  .filter((ctx) => ctx.hasChatType("private") || ctx.entities("mention").map(e => e.text).join("") === `@${ctx.me.username}`)
  .use(async (ctx) => {
    // deno-lint-ignore no-explicit-any
    ctx.api.config.use(addReplyParam(ctx as any) as any);
    if (!ctx.message?.text) return;
    const quotedMessage = ctx.message.reply_to_message;

    await ctx.replyWithChatAction("typing");

    await openai.beta.chat.completions.runTools({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
          You are a helpful assistant that sets reminders, talking to the user via a telegram chatbot.
          Refuse to do anything that is not related to setting a reminder or obtaining the current date and time.
          You cannot set recurring reminders, nor can you set reminders for a date and time that has already passed.
          You can set at most 10 reminders at a time.
          When asked to set a reminder, use the message provided by ther user or an empty string.
          When returning dates, always return the date in exact terms. For example, instead of "tomorrow at 5pm", say "21/03/2024 27:00"
          When setting a reminder, always say for what date and time it was set.
          Be as brief as possible.
          When making a network request, add the protocol to the URL. For example, instead of "example.com", say "https://example.com". If an error occurs, try again with a different protocol.
          When calling setReminder, always provide the date and time in ISO 8601 format.
          Before taking any actions regarding setting a reminder, make sure to check for the current date and time.
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
        if (msg.role === "assistant" && msg.content) await ctx.reply(msg.content);
        console.log(`[${msg.role}] ${msg.content}`);
      })
      .on("error", (error) => {
        console.error("Error", error);
        ctx.reply(
          `There was an error processing this message:\n<pre>${
            error.message.split(".").map((l) => l.trim()).join(".\n")
          }</pre>`,
          { parse_mode: "HTML" },
        );
      })
      .done();
  });
