import { Commands } from "@grammyjs/commands";
import { Middleware } from "grammy";

type CommandsInstance = InstanceType<typeof Commands>;
type Command = ReturnType<CommandsInstance["command"]>;

export function addToAllScopes(command: Command, middleware: Middleware) {
  command.addToScope({ type: "default" }, middleware)
    .addToScope({ type: "all_private_chats" }, middleware)
    .addToScope({ type: "all_chat_administrators" }, middleware)
    .addToScope({ type: "all_group_chats" }, middleware);
}
