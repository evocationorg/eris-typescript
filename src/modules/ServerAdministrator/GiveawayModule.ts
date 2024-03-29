import { monitor } from "@utils/monitor";
import inhibitors from "@utils/inhibitors";
import strings, { commandDescriptions } from "@utils/messages";
import { command, CommandCategories } from "@utils/commands";
import Discord from "discord.js";
import { Giveaway, LevelRole } from "@database/models";
import { Module } from "@utils/modules";
import { GiveawayArgs, handleGiveawayWin } from "@utils/GiveawayManager";
import * as Arguments from "@utils/arguments";
import scheduler from "@utils/scheduler";
import { emotes, env } from "@utils/constants";

export default class GiveawayModule extends Module {
  @monitor({ event: "messageReactionAdd" })
  async messageReactionAdd(reaction: Discord.MessageReaction, user: Discord.User): Promise<void> {
    if (reaction.partial) reaction = await reaction.fetch();
    if (reaction.message.guild.id !== env.MAIN_GUILD_ID) return;
    if (user.bot) return;
    const giveaway = await Giveaway.findOne({ where: { messageId: reaction.message.id } });
    if (!giveaway) return;
    const levelData = await LevelRole.find();
    const levelRoles = levelData.map((r) => r.id);
    if (!reaction.message.guild.members.resolve(user.id).roles.cache.some((r) => levelRoles.includes(r.id))) reaction.users.remove(user.id);
  }

  @command({
    inhibitors: [inhibitors.adminOnly], args: [Arguments.Duration, Number, new Arguments.Remainder(String)], group: CommandCategories.Giveaways, staff: true, description: commandDescriptions.start, usage: "<duration:duration> <winners:number> <prize:...string>"
  })
  async start(msg: Discord.Message, duration: Arguments.Duration, winners: number, prize: string): Promise<void> {
    msg.delete();
    const giveawayMsg = await msg.channel.send(strings.modules.administrator.giveaways.loadingMessage);
    giveawayMsg.react(emotes.giveaway.giftreactionid);

    const startTimestamp = Math.round(Date.now());

    const giveaway = await Giveaway.create({
      prize,
      duration: duration.duration,
      messageId: giveawayMsg.id,
      channelId: msg.channel.id,
      startTime: new Date(startTimestamp),
      endTime: new Date(startTimestamp + duration.duration),
      startedBy: msg.author.id,
      winners
    }).save();

    scheduler.newEvent<GiveawayArgs>("../GiveawayManager", 1, {
      channelId: msg.channel.id,
      giveawayId: giveaway.id,
      duration: duration.duration,
      startTime: startTimestamp,
      endTime: startTimestamp + duration.duration
    });
    await giveawayMsg.channel.send("<@&727558105705086976>");
  }

  @command({
    inhibitors: [inhibitors.adminOnly], args: [new Arguments.Optional(String)], group: CommandCategories.Giveaways, staff: true, description: commandDescriptions.reroll, usage: "[messageid:string]"
  })
  async reroll(msg: Discord.Message, messageId?: string): Promise<void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.notValidMessageID));
      const message = await msg.channel.messages.fetch(messageId);
      if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.giveaway.giftreactionid)) { return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noGiveawayMessageLinked)); }

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (!giveaway) return;
      const reaction = message.reactions.resolve(emotes.giveaway.giftreactionid);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter((u) => u.bot === false)
        .filter((u) => u.id !== this.client.user.id)
        .random(1)
        .filter((u) => u)[0];

      msg.channel.send(strings.general.success(strings.modules.administrator.giveaways.rerollNewWinner(message.embeds[0].author.name, user, `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}`)));
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter((m) => m.author.id === this.client.user.id)
        .filter((m) => m.embeds.length > 0)
        .filter((m) => m.reactions.cache.has(emotes.giveaway.giftreactionid))
        .first();

      if (!message) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noRecentGiveawaysFound));

      const reaction = message.reactions.resolve(emotes.giveaway.giftreactionid);
      const __users = await reaction.users.fetch();
      const user = __users
        .filter((u) => u.bot === false)
        .filter((u) => u.id !== this.client.user.id)
        .random(1)
        .filter((u) => u)[0];

      msg.channel.send(strings.general.success(strings.modules.administrator.giveaways.rerollNewWinner(message.embeds[0].author.name, user, `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${message.id}`)));
    }
  }

  @command({
    inhibitors: [inhibitors.adminOnly], args: [new Arguments.Optional(String)], group: CommandCategories.Giveaways, staff: true, description: commandDescriptions.end, usage: "[messageid:string]"
  })
  async end(msg: Discord.Message, messageId?: string): Promise<void> {
    if (messageId) {
      if (!messageId.match("\\d{17,20}")) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.notValidMessageID));
      try {
        const message = await msg.channel.messages.fetch(messageId);
        if (message.author.id !== this.client.user.id || message.embeds.length === 0 || !message.reactions.cache.has(emotes.giveaway.giftreactionid)) { return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noGiveawayMessageLinked)); }

        const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
        if (giveaway.ended) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.giveawayAlreadyEnded));
        await handleGiveawayWin({
          channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null
        }, giveaway);
      } catch (e) {
        const giveaway = await Giveaway.findOne({ where: { messageId } });
        if (!giveaway) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.notValidMessageID));
        giveaway.ended = true;
        await giveaway.save();
        msg.channel.send(strings.modules.administrator.giveaways.giveawayEnded);
      }
    } else {
      const _msgs = await msg.channel.messages.fetch({ limit: 100 });
      const message = _msgs
        .filter((m) => m.author.id === this.client.user.id)
        .filter((m) => m.embeds.length > 0)
        .filter((m) => m.reactions.cache.has(emotes.giveaway.giftreactionid))
        .first();

      if (!message) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noRecentGiveawaysFound));

      const giveaway = await Giveaway.findOne({ where: { messageId: message.id } });
      if (giveaway.ended) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.mostRecentGiveawayAlreadyEnded));
      await handleGiveawayWin({
        channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null
      }, giveaway);
    }
  }

  @command({
    inhibitors: [inhibitors.adminOnly], group: CommandCategories.Giveaways, staff: true, description: commandDescriptions.list
  })
  async list(msg: Discord.Message): Promise<void> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const messageArray = [strings.modules.administrator.giveaways.activeGiveaways];

    for (const [index, giveaway] of giveaways.entries()) {
      messageArray.push(strings.modules.administrator.giveaways.giveawayListMap(index, giveaway));
    }

    if (messageArray.length === 1) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noCurrentActiveGiveaway));

    await msg.channel.send(messageArray.join("\n\n"), { allowedMentions: { users: [] } });
  }

  @command({
    inhibitors: [inhibitors.adminOnly], group: CommandCategories.Giveaways, staff: true, description: commandDescriptions.endall
  })
  async endall(msg: Discord.Message): Promise<void> {
    const giveaways = await Giveaway.find({ where: { ended: false } });
    const endedGiveaways = [strings.modules.administrator.giveaways.endedGivewaways];

    for await (const giveaway of giveaways) {
      const message = await msg.channel.messages.fetch(giveaway.messageId);
      if (!message) {
        giveaway.ended = true;
        await giveaway.save();
        // eslint-disable-next-line no-continue
        continue;
      }
      await handleGiveawayWin({
        channelId: msg.channel.id, giveawayId: giveaway.id, duration: giveaway.duration, startTime: null, endTime: null
      }, giveaway);
      endedGiveaways.push();
    }

    if (endedGiveaways.length === 1) return strings.errors.errorMessage(msg, strings.errors.error(strings.modules.administrator.giveaways.noCurrentActiveGiveaway));

    await msg.channel.send(endedGiveaways.join("\n\n"), { allowedMentions: { users: [] } });
  }
}
