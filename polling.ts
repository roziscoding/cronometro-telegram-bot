import { bot } from "./bot.ts";

await bot.start({
  onStart: ({ username }) => {
    console.log(`Listening as @${username}`);
  },
});
