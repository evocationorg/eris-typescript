import { Module, ErisClient, monitor, command, inhibitors, scheduler, GiveawayArgs, emotes, timeFormatter } from "@lib/utils";
import { Message } from "discord.js";
import { Remainder, Optional } from "@lib/utils/arguments/Arguments";
import { Giveaway } from "@database/models";
import Duration from "@lib/utils/arguments/Duration";
import { handleGiveawayWin } from "@lib/utils/GiveawayManager";
import { strings, commandDescriptions } from "@lib/utils/messages";

export default class GiveawayModule extends Module {
  constructor(client: ErisClient) {
    super(client);
  }


  @command({ inhibitors: [inhibitors.adminOnly], args: [Duration, Number, new Remainder(String)], group: "Giveaways", staff: true, description: commandDescriptions.start })
  async start(msg: Message, duration: Duration, winners: number, prize: string): Promise<void> {
    msg.delete();
    const giveawayMsg = await msg.channel.send(strings.modules.giveaway.loadingMessage);
    giveawayMsg.react(emotes.giveaway.giftreactionid);

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

  @command({ inhibitors: [inhibitors.adminOnly], args: [new Optional(String)], group: "Giveaways", staff: true, description: commandDescriptions.reroll })
  async reroll(msg: Message, messageId?: string): Promise<Message | void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return msg.channel.send(strings.general.error(strings.modules.giveaway.notValidMessageID));
      const message = await msg.channel.messages.fetch(messageId);
      if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.giveaway.giftreactionid))
        return msg.channel.send(strings.general.error(strings.modules.giveaway.noGiveawayMessageLinked));

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      const reaction = message.reactions.resolve(emotes.giveaway.giftreactionid);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter(u => u.bot === false)
        .filter(u => u.id !== this.client.user.id)
        .random(1)
        .filter(u => u)[0];

      msg.channel.send(strings.general.success(strings.modules.giveaway.rerollNewWinner(message.embeds[0].author.name, user, `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}`)));
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter(m => m.author.id === this.client.user.id)
        .filter(m => m.embeds.length > 0)
        .filter(m => m.reactions.cache.has(emotes.giveaway.giftreactionid))
        .first();

      if (!message) return msg.channel.send(strings.general.error(strings.modules.giveaway.noRecentGiveawaysFound));

      const reaction = message.reactions.resolve(emotes.giveaway.giftreactionid);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter(u => u.bot === false)
        .filter(u => u.id !== this.client.user.id)
        .random(1)
        .filter(u => u)[0];

      msg.channel.send(strings.general.success(strings.modules.giveaway.rerollNewWinner(message.embeds[0].author.name, user, `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}`)));
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [new Optional(String)], group: "Giveaways", staff: true, description: commandDescriptions.end })
  async end(msg: Message, messageId?: string): Promise<Message | void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return msg.channel.send(strings.general.error(strings.modules.giveaway.notValidMessageID));
      const message = await msg.channel.messages.fetch(messageId);
      if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.giveaway.giftreactionid))
        return msg.channel.send(strings.general.error(strings.modules.giveaway.noGiveawayMessageLinked));

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (giveaway.ended) return msg.channel.send(strings.general.error(strings.modules.giveaway.giveawayAlreadyEnded));
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter(m => m.author.id === this.client.user.id)
        .filter(m => m.embeds.length > 0)
        .filter(m => m.reactions.cache.has(emotes.giveaway.giftreactionid))
        .first();

      if (!message) return msg.channel.send(strings.general.error(strings.modules.giveaway.noRecentGiveawaysFound));

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (giveaway.ended) return msg.channel.send(strings.general.error(strings.modules.giveaway.mostRecentGiveawayAlreadyEnded));
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: "Giveaways", staff: true, description: commandDescriptions.list })
  async list(msg: Message): Promise<void|Message> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const messageArray = [strings.modules.giveaway.activeGiveaways];

    for (const [index, giveaway] of giveaways.entries()) {
      messageArray.push(strings.modules.giveaway.giveawayListMap(index, giveaway));
    }

    if (messageArray.length === 1) return msg.channel.send(strings.general.error(strings.modules.giveaway.noCurrentActiveGiveaway));

    await msg.channel.send(messageArray.join("\n\n"), { allowedMentions: { users: [] } });
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: "Giveaways", staff: true, description: commandDescriptions.endall })
  async endall(msg: Message): Promise<void|Message> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const endedGiveaways = [strings.modules.giveaway.endedGivewaways];

    for await (const [index, giveaway] of giveaways.entries()) {
      const channel = await this.client.channels.fetch(giveaway.channelId);
      const message = await msg.channel.messages.fetch(giveaway.messageId);
      await handleGiveawayWin({ channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null }, giveaway);
      endedGiveaways.push();
    }

    if (endedGiveaways.length === 1) return msg.channel.send(strings.general.error(strings.modules.giveaway.noCurrentActiveGiveaway));

    await msg.channel.send(endedGiveaways.join("\n\n"), { allowedMentions: { users: [] } });
  }
}