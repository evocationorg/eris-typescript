import { monitor, Module, ErisClient, CHANNELS, MAIN_GUILD_ID, strings, P } from "@lib/utils";
import { GuildEmoji, TextChannel, Message } from "discord.js";

export default class EmojiModule extends Module {
  constructor(client: ErisClient) {
    super(client);
  }

  @monitor({ event: "emojiCreate" })
  async emojiCreate(emoji: GuildEmoji): P<Message> {
    if (emoji.guild.id !== MAIN_GUILD_ID) return;
    const channel = await this.client.channels.fetch(CHANNELS.EMOJI_LOG) as TextChannel;
    if (emoji.animated) return channel.send(strings.modules.emojis.animatedEmojiAdded(emoji));
    return channel.send(strings.modules.emojis.emojiAdded(emoji));
  }

  @monitor({ event: "emojiUpdate" })
  async emojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): P<Message> {
    if (newEmoji.guild.id !== MAIN_GUILD_ID) return;
    if (newEmoji.name === oldEmoji.name) return;
    const channel = await this.client.channels.fetch(CHANNELS.EMOJI_LOG) as TextChannel;
    if (newEmoji.animated) return channel.send(strings.modules.emojis.animatedEmojiUpdated(oldEmoji, newEmoji));
    await channel.send(strings.modules.emojis.emojiUpdated(oldEmoji, newEmoji));
  }

  @monitor({ event: "emojiDelete" })
  async emojiDelete(emoji: GuildEmoji): P<Message> {
    if (emoji.guild.id !== MAIN_GUILD_ID) return;
    const channel = await this.client.channels.fetch(CHANNELS.EMOJI_LOG) as TextChannel;
    if (emoji.animated) return channel.send(strings.modules.emojis.animatedEmojiDeleted(emoji));
    await channel.send(strings.modules.emojis.emojiDeleted(emoji));
  }
}