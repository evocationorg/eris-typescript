import { Module, command, inhibitors, Remainder, guildMemberParser, NEGATIONS } from "@lib/utils";
import { GuildMember, Message } from "discord.js";

export default class PermissionsModule extends Module {
  @command({ inhibitors: [inhibitors.moderatorOnly], group: "Permission Negations", args: [new Remainder(String)], aliases: ["na"], staff: true })
  async negateart(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    const added: GuildMember[] = [];
    const removed: GuildMember[] = [];
    for await (const member of members) {
      if (member.roles.cache.has(NEGATIONS.ART)) {
        member.roles.remove(NEGATIONS.ART);
        removed.push(member);
      } else {
        member.roles.add(NEGATIONS.ART);
        added.push(member);
      }
    }
    const codeblock = [
      "```diff",
      ...added.map(r => `+ ${r.user.tag}`),
      ...removed.map(r => `- ${r.user.tag}`),
      "```"
    ].join("\n");
    await msg.channel.send(["**SUCCESS**: Art negations have been executed for the specified users.", codeblock].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: "Permission Negations", args: [new Remainder(String)], aliases: ["nr"], staff: true })
  async negatereaction(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    const added: GuildMember[] = [];
    const removed: GuildMember[] = [];
    for await (const member of members) {
      if (member.roles.cache.has(NEGATIONS.REACTIONS)) {
        member.roles.remove(NEGATIONS.REACTIONS);
        removed.push(member);
      } else {
        member.roles.add(NEGATIONS.REACTIONS);
        added.push(member);
      }
    }
    const codeblock = [
      "```diff",
      ...added.map(r => `+ ${r.user.tag}`),
      ...removed.map(r => `- ${r.user.tag}`),
      "```"
    ].join("\n");
    await msg.channel.send(["**SUCCESS**: Reaction negations have been executed for the specified users.", codeblock].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: "Permission Negations", args: [new Remainder(String)], aliases: ["nm"], staff: true })
  async negatemedia(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    const added: GuildMember[] = [];
    const removed: GuildMember[] = [];
    for await (const member of members) {
      if (member.roles.cache.has(NEGATIONS.MEDIA)) {
        member.roles.remove(NEGATIONS.MEDIA);
        removed.push(member);
      } else {
        member.roles.add(NEGATIONS.MEDIA);
        added.push(member);
      }
    }
    const codeblock = [
      "```diff",
      ...added.map(r => `+ ${r.user.tag}`),
      ...removed.map(r => `- ${r.user.tag}`),
      "```"
    ].join("\n");
    await msg.channel.send(["**SUCCESS**: Media negations have been executed for the specified users.", codeblock].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: "Permission Negations", args: [new Remainder(String)], aliases: ["ne"], staff: true })
  async negateexperience(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    const added: GuildMember[] = [];
    const removed: GuildMember[] = [];
    for await (const member of members) {
      if (member.roles.cache.has(NEGATIONS.EXPERIENCE)) {
        member.roles.remove(NEGATIONS.EXPERIENCE);
        removed.push(member);
      } else {
        member.roles.add(NEGATIONS.EXPERIENCE);
        added.push(member);
      }
    }
    const codeblock = [
      "```diff",
      ...added.map(r => `+ ${r.user.tag}`),
      ...removed.map(r => `- ${r.user.tag}`),
      "```"
    ].join("\n");
    await msg.channel.send(["**SUCCESS**: Experience negations have been executed for the specified users.", codeblock].join("\n"), { split: true });
  }
}