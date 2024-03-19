import { Commands } from "@grammyjs/commands";
import { Context } from "grammy";
import block from "./block.ts";
import help from "./help.ts";
import now from "./now.ts";
import reminder from "./reminder.ts";
import remindme from "./remindme.ts";
import start from "./start.ts";
import unblock from "./unblock.ts";

export const myCommands = new Commands();

const commandList: Array<(commands: Commands<Context>, kv: Deno.Kv) => unknown> = [
  start,
  block,
  unblock,
  remindme,
  help,
  reminder,
  now
];

export function install(kv: Deno.Kv) {
  for (const command of commandList) {
    command(myCommands, kv);
  }

  return myCommands;
}
