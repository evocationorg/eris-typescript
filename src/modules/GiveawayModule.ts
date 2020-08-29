import { Module, ErisClient, monitor, command, inhibitors, scheduler, GiveawayArgs, emotes, timeFormatter } from "@lib/utils";
import { Message } from "discord.js";
import { Remainder, Optional } from "@lib/utils/arguments/Arguments";
import { Giveaway } from "@database/models";
import Duration from "@lib/utils/arguments/Duration";
import { handleGiveawayWin } from "@lib/utils/GiveawayManager";

export default class GiveawayModule extends Module {
  constructor(client: ErisClient) {
    super(client);
  }


  @command({ inhibitors: [inhibitors.adminOnly], args: [Duration, Number, new Remainder(String)], group: "Giveaways" })
  async start(msg: Message, duration: Duration, winners: number, prize: string): Promise<void> {
    msg.delete();
    const giveawayMsg = await msg.channel.send("Loading...");
    giveawayMsg.react("737019540495663276");

    const startTimestamp = Math.round(Date.now());

    const giveaway = await Giveaway.create({
      prize: prize,
      duration: duration.duration,
      messageId: giveawayMsg.id,
      channelId: msg.channel.id,
      startTime: new Date(startTimestamp),
      endTime: new Date(startTimestamp + duration.duration),
      startedBy: msg.author.id,
      winners: winners
    }).save();

    scheduler.newEvent<GiveawayArgs>("../GiveawayManager", 1, {
      channelId: msg.channel.id,
      giveawayId: giveaway.id,
      duration: duration.duration,
      startTime: startTimestamp,
      endTime: startTimestamp + duration.duration
    });
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [new Optional(String)], group: "Giveaways" })
  async reroll(msg: Message, messageId?: string): Promise<Message | void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: That is not a valid message ID! Try running this command without a message ID to reroll the winner of the most recent giveaway in this channel.`);
      const message = await msg.channel.messages.fetch(messageId);
      if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.GIVEAWAYS.GIFT_REACTION))
        return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: The message you linked is not a giveaway message!`);

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      const reaction = message.reactions.resolve(emotes.GIVEAWAYS.GIFT_REACTION);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter(u => u.bot === false)
        .filter(u => u.id !== this.client.user.id)
        .random(1)
        .filter(u => u);

      msg.channel.send([
        `**SUCCESS**: The new winner of **${message.embeds[0].author.name}** is ${user}.`,
        `**MESSAGE LINK**: <https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}>`
      ].join("\n"));
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter(m => m.author.id === this.client.user.id)
        .filter(m => m.embeds.length > 0)
        .filter(m => m.reactions.cache.has(emotes.GIVEAWAYS.GIFT_REACTION))
        .first();

      if (!message) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: I couldn't find any recent giveaways in this channel.`);

      const reaction = message.reactions.resolve(emotes.GIVEAWAYS.GIFT_REACTION);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter(u => u.bot === false)
        .filter(u => u.id !== this.client.user.id)
        .random(1)
        .filter(u => u);

      msg.channel.send([
        `**SUCCESS**: The new winner of **${message.embeds[0].author.name}** is ${user}.`,
        `**MESSAGE LINK**: <https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}>`
      ].join("\n"));
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [new Optional(String)], group: "Giveaways" })
  async end(msg: Message, messageId?: string): Promise<Message | void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: That is not a valid message ID! Try running without an ID to use the most recent giveaway in this channel.`);
      const message = await msg.channel.messages.fetch(messageId);
      if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.GIVEAWAYS.GIFT_REACTION))
        return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: The message you linked is not a giveaway message!`);

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (giveaway.ended) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: Giveaway has already ended.`);
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter(m => m.author.id === this.client.user.id)
        .filter(m => m.embeds.length > 0)
        .filter(m => m.reactions.cache.has(emotes.GIVEAWAYS.GIFT_REACTION))
        .first();

      if (!message) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: I couldn't find any recent giveaways in this channel.`);

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (giveaway.ended) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: The most recent giveaway in this channel has already ended..`);
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: "Giveaways" })
  async list(msg: Message): Promise<void|Message> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const messageArray = [
      `${this.client.emojis.resolve(emotes.GIVEAWAYS.GIFT_MESSAGE)} **ACTIVE GIVEAWAYS**`
    ];

    for (const [index, giveaway] of giveaways.entries()) {
      messageArray.push(`\`${index + 1}.\` **\`[CREATION]\`** \`[${timeFormatter(giveaway.startTime)}]\` **${giveaway.prize}** in <#${giveaway.channelId}> (\`${giveaway.channelId}\`). Started by **<@${giveaway.startedBy}>** (\`${giveaway.startedBy}\`). Ends at \`${timeFormatter(giveaway.endTime)}\`.`);
    }

    if (messageArray.length === 1) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: There are currently no active giveaways on the server.`);

    await msg.channel.send(messageArray.join("\n\n"), { allowedMentions: { users: [] } });
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: "Giveaways" })
  async endall(msg: Message): Promise<void|Message> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const endedGiveaways = [`${this.client.emojis.resolve(emotes.GIVEAWAYS.GIFT_MESSAGE)} **ENDED GIVEAWAYS**`];

    for await (const [index, giveaway] of giveaways.entries()) {
      const channel = await this.client.channels.fetch(giveaway.channelId);
      const message = await msg.channel.messages.fetch(giveaway.messageId);
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
      endedGiveaways.push(`\`${index + 1}.\` **\`[CREATION]\`** \`[${timeFormatter(giveaway.startTime)}]\` **${giveaway.prize}** in <#${giveaway.channelId}> (\`${giveaway.channelId}\`). Started by **<@${giveaway.startedBy}>** (\`${giveaway.startedBy}\`). Ended at \`${timeFormatter()}\`.`);
    }

    if (endedGiveaways.length === 1) return msg.channel.send(`${this.client.emojis.resolve(emotes.UNCATEGORISED.DENIAL)} **COMMAND INHIBITED**: There are no running giveaways.`);

    await msg.channel.send(endedGiveaways.join("\n\n"), { allowedMentions: { users: [] } });
  }
}