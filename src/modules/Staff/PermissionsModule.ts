import { Module, command, inhibitors, Remainder, guildMemberParser, NEGATIONS, CommandCategories, commandDescriptions, strings, codeblockMember } from "@lib/utils";
import { GuildMember, Message } from "discord.js";

export default class PermissionsModule extends Module {
  @command({ inhibitors: [inhibitors.moderatorOnly], group: CommandCategories["Moderation"], args: [new Remainder(String)], aliases: ["na"], staff: true, usage: "<members:...guildmember|snowflake>", description: commandDescriptions.negateart })
  async negateart(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
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
    await msg.channel.send([strings.general.success(strings.modules.permissions.negations("Art")), codeblockMember(added, removed)].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: CommandCategories["Moderation"], args: [new Remainder(String)], aliases: ["nf"], staff: true, usage: "<members:...guildmember|snowflake>", description: commandDescriptions.negatefeedback })
  async negatefeedback(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
    const added: GuildMember[] = [];
    const removed: GuildMember[] = [];
    for await (const member of members) {
      if (member.roles.cache.has(NEGATIONS.FEEDBACK)) {
        member.roles.remove(NEGATIONS.FEEDBACK);
        removed.push(member);
      } else {
        member.roles.add(NEGATIONS.FEEDBACK);
        added.push(member);
      }
    }
    await msg.channel.send([strings.general.success(strings.modules.permissions.negations("Feedback")), codeblockMember(added, removed)].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: CommandCategories["Moderation"], args: [new Remainder(String)], aliases: ["nr"], staff: true, usage: "<members:...guildmember|snowflake>", description: commandDescriptions.negatereaction })
  async negatereaction(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
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
    await msg.channel.send([strings.general.success(strings.modules.permissions.negations("Reaction")), codeblockMember(added, removed)].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: CommandCategories["Moderation"], args: [new Remainder(String)], aliases: ["nm"], staff: true, usage: "<members:...guildmember|snowflake>", description: commandDescriptions.negatemedia })
  async negatemedia(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
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
    await msg.channel.send([strings.general.success(strings.modules.permissions.negations("Media")), codeblockMember(added, removed)].join("\n"), { split: true });
  }

  @command({ inhibitors: [inhibitors.moderatorOnly], group: CommandCategories["Moderation"], args: [new Remainder(String)], aliases: ["ne"], staff: true, usage: "<members:...guildmember|snowflake>", description: commandDescriptions.negateexperience })
  async negateexperience(msg: Message, _members: string): Promise<void> {
    msg.delete();
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
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
    await msg.channel.send([strings.general.success(strings.modules.permissions.negations("Experience")), codeblockMember(added, removed)].join("\n"), { split: true });
  }
}