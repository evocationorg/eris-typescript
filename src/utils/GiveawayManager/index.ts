import { emotes } from "@utils/constants";
import { Giveaway } from "@utils/database/models";
import Embed from "@utils/embed";
import strings from "@utils/messages";
import scheduler from "@utils/scheduler";
import { getDuration } from "@utils/time";
import Discord from "discord.js";
import { client } from "../..";

export interface GiveawayArgs {
  startTime: number,
  duration: number,
  channelId: Discord.Snowflake,
  giveawayId: string,
  endTime: number
}

// eslint-disable-next-line func-names
export default async function (args: GiveawayArgs): Promise<void> {
  // Get the current timestamp.
  const timestamp = Math.round(Date.now() / 1000);
  // Get the start timestamp
  const startTimestamp = Math.round(args.startTime / 1000);

  const duration = Math.round(args.duration / 1000);
  const timeRemaining = (startTimestamp + duration) - timestamp;

  const giveaway = await Giveaway.findOne({ where: { id: args.giveawayId } });
  if (!giveaway) return;
  if (giveaway.ended) return;

  if (timeRemaining <= 0) {
    await handleGiveawayWin(args, giveaway);
    return;
  }

  await editEmbed(args, giveaway);

  if (timeRemaining > 3600) {
    // More than 1 hour before the giveaway ends
    scheduler.newEvent("../GiveawayManager", 3600, args);
  } else if (timeRemaining > 600) {
    // More than 10 minutes before the giveaway ends
    scheduler.newEvent("../GiveawayManager", 600, args);
  } else if (timeRemaining > 60) {
    // More than 1 minute before the giveaway ends
    scheduler.newEvent("../GiveawayManager", 60, args);
  } else if (timeRemaining > 10) {
    // More than 10 seconds before the giveaway ends
    scheduler.newEvent("../GiveawayManager", 10, args);
  } else {
    // Run each second
    scheduler.newEvent("../GiveawayManager", 1, args);
  }
}

const handleNoWinner = async (args: GiveawayArgs, giveaway: Giveaway): Promise<void> => {
  const embed = new Embed()
    .setColor("#36393F")
    .setAuthor(giveaway.prize)
    .setFooter(strings.modules.administrator.giveaways.embed.footerEnded(giveaway.winners))
    .setTimestamp(new Date(args.startTime + giveaway.duration))
    .setDescription(strings.modules.administrator.giveaways.embed.noWinner);
  const channel = await client.channels.fetch(args.channelId) as Discord.TextChannel;
  const message = await channel.messages.fetch(giveaway.messageId);

  await channel.send(strings.modules.administrator.giveaways.noWinner(giveaway.prize));

  await message.edit(strings.modules.administrator.giveaways.embed.giveawayEndedHeader, { embed });
};

export const handleGiveawayWin = async (args: GiveawayArgs, giveaway: Giveaway): Promise<void> => {
  const embed = new Embed()
    .setColor("#36393F");
  const channel = await client.channels.fetch(args.channelId) as Discord.TextChannel;
  const guild = await channel.guild.fetch();
  const message = await channel.messages.fetch(giveaway.messageId);
  const reaction = message.reactions.resolve(emotes.giveaway.giftreactionid);
  const __users = await reaction.users.fetch();
  const users = __users
    .filter((u) => u.bot === false)
    .filter((u) => u.id !== client.user.id)
    .filter((u) => guild.members.cache.has(u.id))
    .filter((u) => !guild.members.resolve(u).roles.cache.find((r) => r.name === "Muted"))
    .random(giveaway.winners)
    .filter((u) => u);

  giveaway.ended = true;
  await giveaway.save();

  if (users.length === 0) return handleNoWinner(args, giveaway);

  embed
    .setAuthor(giveaway.prize)
    .setDescription(strings.modules.administrator.giveaways.embed.winners(users.map((user) => `→ ${user} (\`${user.id}\`)`).join("\n")))
    .setTimestamp(new Date(args.startTime + giveaway.duration))
    .setFooter(strings.modules.administrator.giveaways.embed.footerEnded(giveaway.winners));

  await message.edit(strings.modules.administrator.giveaways.embed.giveawayEndedHeader, { embed });

  await channel.send(strings.modules.administrator.giveaways.winners(users.map((user) => user).join(", "), giveaway.prize, `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`));
};

const editEmbed = async (args: GiveawayArgs, giveaway: Giveaway): Promise<void> => {
  const channel = await client.channels.fetch(args.channelId) as Discord.TextChannel;
  const message = await channel.messages.fetch(giveaway.messageId);
  if (!message) {
    giveaway.ended = true;
    await giveaway.save();
    return;
  }
  // Create the embed.
  const embed = new Embed()
    .setAuthor(giveaway.prize)
    .setDescription(strings.modules.administrator.giveaways.embed.description(getDuration(args.startTime + giveaway.duration - Date.now())))
    .setFooter(strings.modules.administrator.giveaways.embed.footer(giveaway.winners))
    .setTimestamp(new Date(args.startTime + giveaway.duration));

  // Edit the message.
  await message.edit(strings.modules.administrator.giveaways.embed.giveawayHeader, { embed });
};
