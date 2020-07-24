import { Message } from "discord.js";
import { command, listener, Module, ErisClient } from "@lib/utils";
import { Guild } from "discord.js";

export default class EventModule extends Module {
  constructor(client: ErisClient) {
    super(client);
  }
  @listener({ event: "guildUpdate" })
  onGuidUpdate(oldGuild: Guild, newGuild: Guild) {
    if (newGuild.id == process.env.MAIN_GUILD_ID && newGuild.name !== process.env.MAIN_GUILD_NAME) newGuild.edit({ name: process.env.MAIN_GUILD_NAME });
  }

  @listener({ event: "ready" })
  onReady() {
    console.log("Bot up and running!");
  }

  @command()
  ping(msg: Message) {
    msg.reply("pong");
  }
}