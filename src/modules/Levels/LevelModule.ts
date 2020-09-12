import { monitor, Module, ErisClient, MAIN_GUILD_ID, levelConstants, strings, roleParser, inhibitors, command, Optional, Remainder, CommandCategories, commandDescriptions, channelParser, Embed, NEGATIONS, guildMemberParser, ROLES, escapeRegex } from "@lib/utils";
import { Message, GuildMember, Role, User } from "discord.js";
import RedisClient from "@lib/utils/client/RedisClient";
import { UserXP, XPExclusion, LevelRole, XPMultiplier } from "@lib/utils/database/models";
import Duration from "@lib/utils/arguments/Duration";

export default class LevelModule extends Module {

  @monitor({ event: "guildMemberUpdate" })
  async onGuildMemberRoleAdd(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    if (newMember.guild.id !== MAIN_GUILD_ID) return;
    const xpData = await UserXP.findOne({ where: { id: newMember.id } });
    if (!xpData) return;
    const userLevel = levelConstants.getLevelFromXP(xpData.xp);
    let rolesData = await LevelRole.find();
    rolesData = rolesData.sort((a, b) => a.level - b.level);
    const roleData = rolesData.find(r => r.level === userLevel);
    if (!roleData) {
      const data = rolesData.filter(rr => rr.level < userLevel).reverse()[0];
      if (!data) return;
      if (oldMember.roles.cache.has(data.id) && !newMember.roles.cache.has(data.id)) {
        const auditLogs = await newMember.guild.fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE" });
        const firstEntry = auditLogs.entries.first();
        if (!(firstEntry.changes[0].key === "$remove" && ["242730576195354624", this.client.user.id].includes(firstEntry.executor.id)))
          newMember.roles.add(data.id, strings.modules.levels.auditLogRoleRemove);
      }
    } else {
      if (oldMember.roles.cache.has(roleData.id) && !newMember.roles.cache.has(roleData.id)) {
        const auditLogs = await newMember.guild.fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE" });
        const firstEntry = auditLogs.entries.first();
        if (!(firstEntry.changes[0].key === "$remove" && ["242730576195354624", this.client.user.id].includes(firstEntry.executor.id)))
          newMember.roles.add(roleData.id, strings.modules.levels.auditLogRoleRemove);
      }
    }
  }

  @monitor({ event: "guildMemberUpdate" })
  async onGuildMemberRoleAdd2(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    if (newMember.guild.id !== MAIN_GUILD_ID) return;
    const levelData = await LevelRole.find();
    const roles = levelData.map(r => r.id);
    for (const role of roles) {
      if (!oldMember.roles.cache.has(role) && newMember.roles.cache.has(role)) {
        if (newMember.roles.cache.has(ROLES.HYACINTH)) newMember.roles.remove(ROLES.HYACINTH);
      }
    }
  }

  getRandomXP(): number {
    return Math.floor(Math.random() * 26) + 25;
  }

  @monitor({ event: "message" })
  async onMessage(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.guild.id !== MAIN_GUILD_ID) return;

    let user = await UserXP.findOne({ where: { id: message.author.id } });
    if (!user) user = await UserXP.create({ id: message.author.id }).save();

    const prefixRegex = new RegExp(`^(<@!?${this.client.user.id}>|${escapeRegex(process.env.PREFIX)})\\s*`);
    if (prefixRegex.test(message.content)) return;

    // blacklists, woohoo
    const roleExclusions = await XPExclusion.find({ where: { type: "role" } });
    const channelExclusions = await XPExclusion.find({ where: { type: "channel" } });
    if (channelExclusions.find(c => c.id === message.channel.id)) return;
    if (roleExclusions.find(r => message.member.roles.cache.has(r.id))) return;
    if (await RedisClient.get(`player:${message.author.id}:check`)) return;

    const randomXP = this.getRandomXP();

    const userMultipliers = await XPMultiplier.find({ where: { type: "user", thingID: message.author.id } });
    let roleMultipliers = await XPMultiplier.find({ where: { type: "role" } });
    roleMultipliers = roleMultipliers.filter(r => message.member.roles.cache.has(r.thingID));
    const serverMultipliers = await XPMultiplier.find({ where: { type: "server" } });

    for await (const multiplier of [...userMultipliers, ...serverMultipliers, ...roleMultipliers]) {
      if (multiplier.endDate) {
        if (multiplier.endDate.getTime() <= new Date().getTime()) {
          await multiplier.remove();
          continue;
        }
      }
      user.xp += (multiplier.multiplier * randomXP);
    }

    user.xp += randomXP;
    await user.save();

    await this.levelRoleCheck(message.member, user.xp);

    await RedisClient.set(`player:${message.author.id}:check`, "1", "ex", 60);
  }

  async levelRoleCheck(member: GuildMember, xp: number): Promise<void> {
    if (member.roles.cache.find(r => r.name === "Muted")) return;
    const userLevel = levelConstants.getLevelFromXP(xp);
    if (userLevel === 0) {
      const rolesData = await LevelRole.find();
      member.roles.remove(rolesData.map(r => r.id), strings.modules.levels.auditlog.xpReset);
      return;
    }
    let rolesData = await LevelRole.find();
    rolesData = rolesData.sort((a, b) => a.level - b.level);
    const roleData = rolesData.find(r => r.level === userLevel);
    if (!roleData) {
      const data = rolesData.filter(rr => rr.level < userLevel).reverse()[0];
      if (!data) return;
      member.roles.remove(rolesData.filter(r => r !== data).map(r => r.id), strings.modules.levels.auditlog.roleRemove);
      member.roles.add(data.id, strings.modules.levels.auditlog.roleAdd);
    } else {
      member.roles.remove(rolesData.filter(r => r !== roleData).map(r => r.id), strings.modules.levels.auditlog.roleRemove);
      member.roles.add(roleData.id, strings.modules.levels.auditlog.roleAdd);
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [String, new Remainder(String)], group: CommandCategories["Server Administrator"], aliases: ["xpi"], staff: true, description: commandDescriptions.xpignore, usage: "<channel|role> <ID/mention>" })
  async xpignore(msg: Message, type: "channel" | "role", id: string): Promise<void | Message> {
    if (msg.channel.type === "dm") return;
    if (type === "role") {
      const role = await roleParser(id, msg);
      if (typeof role === "string") return msg.channel.send(strings.general.error(role));
      if (msg.member.roles.cache.has(role.id)) return msg.channel.send(strings.general.error(strings.modules.exclusions.cantAddRoleToExclusions));
      await XPExclusion.create({
        type: "role",
        id: role.id
      }).save();
      msg.channel.send(strings.general.success(strings.modules.levels.executedExclusions("role")));
    } else if (type === "channel") {
      const channel = await channelParser(id, msg);
      if (typeof channel === "string") return msg.channel.send(strings.general.error(channel));
      await XPExclusion.create({
        type: "channel",
        id: channel.id
      }).save();
      msg.channel.send(strings.general.success(strings.modules.levels.executedExclusions("channel")));
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [new Optional(String), new Optional(String), new Optional(new Remainder(String))], group: CommandCategories["Server Administrator"], aliases: ["xpe"], staff: true, description: commandDescriptions.exclusions, usage: "[remove] [channel|role] [ID/mention]" })
  async xpexclusions(msg: Message, what?: "remove", type?: "role" | "channel", id?: string): Promise<Message> {
    if (!what) {
      const roleExclusions = await XPExclusion.find({ where: { type: "role" } });
      const channelExclusions = await XPExclusion.find({ where: { type: "channel" } });
      const embed = new Embed()
        .addField(strings.modules.levels.exclusionEmbedName("Channel"), channelExclusions.map(u => strings.modules.levels.exclusionMapping(u)).join("\n") || strings.modules.levels.noChannelsExcluded)
        .addField(strings.modules.levels.exclusionEmbedName("Role"), roleExclusions.map(r => strings.modules.levels.exclusionMapping(r)).join("\n") || strings.modules.levels.noRolesExcluded);
      return msg.channel.send(embed);
    }
    if (!["remove"].includes(what)) return msg.channel.send(strings.general.error(strings.general.commandSyntax("e!xpexclusions [remove] [channel|role] [ID/mention]")));

    if (what === "remove") {
      if (!type || !["channel", "role"].includes(type) || !id) return msg.channel.send(strings.general.error(strings.general.commandSyntax("e!xpexclusions [remove] [channel|role] [ID/mention]")));
      if (type === "role") {
        const exclusion = await XPExclusion.findOne({ where: { id: id, type: "role" } });
        if (!exclusion) return msg.channel.send(strings.general.error(strings.modules.levels.roleNotExcluded));
        exclusion.remove();
        msg.channel.send(strings.general.success(strings.modules.levels.updatedExclusionsForRole));
      } else if (type === "channel") {
        const exclusion = await XPExclusion.findOne({ where: { id: id, type: "channel" } });
        if (!exclusion) return msg.channel.send(strings.general.error(strings.modules.levels.channelNotExcluded));
        exclusion.remove();
        msg.channel.send(strings.general.success(strings.modules.levels.updatedExclusionsForChannel));
      }
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [String, new Optional(new Remainder(String))], staff: true, aliases: ["resetxp"], description: commandDescriptions.resetxp, usage: "<user|role|server> [users:...user]" })
  async resetexperience(msg: Message, type: "role" | "user" | "server", _members: string): Promise<void | Message> {
    if (type === "server") {
      await msg.channel.send(strings.modules.levels.resetxp.serverReset);
      let members = 0;
      const message = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { max: 1, time: 60000 });
      if (message.first() && message.first().content.toLowerCase() === "yes") {
        for await (const member of msg.guild.members.cache.array()) {
          const xpData = await UserXP.findOne({ where: { id: member.id } });
          if (!xpData) continue;
          xpData.xp = 0;
          await xpData.save();
          await this.levelRoleCheck(member, xpData.xp);
          members++;
        }
        msg.channel.send(strings.general.success(strings.modules.levels.resetxp.resetxpsuccessfull("user", members)));
      } else return msg.channel.send(strings.modules.levels.resetxp.cancelled);
    } else if (type === "user") {
      const members: GuildMember[] = [];
      for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
      if (members.includes(msg.member)) members.splice(members.indexOf(msg.member), 1);
      for await (const member of members) {
        const xpData = await UserXP.findOne({ where: { id: member.id } });
        if (!xpData) continue;
        xpData.xp = 0;
        await xpData.save();
        await this.levelRoleCheck(member, xpData.xp);
      }
      msg.channel.send(strings.general.success(strings.modules.levels.resetxp.resetxpsuccessfull("user", members.length)));
    } else if (type === "role") {
      const roles: Role[] = [];
      for await (const _member of _members.split(" ")) roles.push(await roleParser(_member, msg) as Role);
      let members: GuildMember[] = [];
      roles.forEach(r => members.push(...r.members.array()));
      members = members.filter((v, i) => members.indexOf(v) === i);
      for await (const member of members) {
        const xpData = await UserXP.findOne({ where: { id: member.id } });
        if (!xpData) continue;
        xpData.xp = 0;
        await xpData.save();
        await this.levelRoleCheck(member, xpData.xp);
      }
      msg.channel.send(strings.general.success(strings.modules.levels.resetxp.resetxpsuccessfull("role", roles.length, members.length)));
    } else return msg.channel.send(strings.general.error(strings.general.commandSyntax("e!resetxp <user|role|server> [users:...user]")));
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [Number, new Optional(new Remainder(String))], aliases: ["ae"], staff: true, description: commandDescriptions.addexperience, usage: "<amount:number> [users:...user]" })
  async addexperience(msg: Message, amount: number, _members: string): Promise<void | Message> {
    if (!msg.member.roles.cache.has(ROLES.LEAD_ADMINISTRATORS)) return;
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    for await (const member of members) {
      let xpData = await UserXP.findOne({ where: { id: member.id } });
      if (!xpData) xpData = await UserXP.create({ id: member.id }).save();
      xpData.xp += amount;
      await xpData.save();
      await this.levelRoleCheck(member, xpData.xp);
    }
    msg.channel.send(strings.general.success(strings.modules.levels.xpAdded(amount, members.length)));
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [Number, new Optional(new Remainder(String))], aliases: ["de"], staff: true, description: commandDescriptions.deductexperience, usage: "<amount:number> [users:...user]" })
  async deductexperience(msg: Message, amount: number, _members: string): Promise<void | Message> {
    if (!msg.member.roles.cache.has(ROLES.LEAD_ADMINISTRATORS)) return;
    const members: GuildMember[] = [];
    for await (const _member of _members.split(" ")) members.push(await guildMemberParser(_member, msg));
    for await (const member of members) {
      let xpData = await UserXP.findOne({ where: { id: member.id } });
      if (!xpData) xpData = await UserXP.create({ id: member.id }).save();
      xpData.xp -= amount;
      if (xpData.xp < 0) xpData.xp = 0;
      await xpData.save();
      await this.levelRoleCheck(member, xpData.xp);
    }
    msg.channel.send(strings.general.success(strings.modules.levels.xpDeducted(amount, members.length)));
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [GuildMember, Number], staff: true, description: commandDescriptions.setlevel, usage: "<user:user> <level:number>" })
  async setlevel(msg: Message, member: GuildMember, level: number): Promise<void | Message> {
    if (!msg.member.roles.cache.has(ROLES.LEAD_ADMINISTRATORS)) return;

    let xpData = await UserXP.findOne({ where: { id: member.id } });
    if (!xpData) xpData = await UserXP.create({ id: member.id }).save();
    let xp = 0;

    for (let i = 0; i < level; i++) {
      xp += levelConstants.getLevelXP(i);
    }
    xpData.xp = xp;
    await xpData.save();
    await this.levelRoleCheck(member, xpData.xp);

    msg.channel.send(strings.general.success(strings.modules.levels.levelSet(member.user, level)));
  }

  @command({ inhibitors: [inhibitors.canOnlyBeExecutedInBotCommands], args: [new Optional(GuildMember)], description: commandDescriptions.rank, usage: "[user:user]" })
  async rank(msg: Message, member?: GuildMember): Promise<void | Message> {
    if (!member) member = msg.member;
    if (member.user.bot) return;
    const data = await userInfo(member.user);
    const embed = new Embed()
      .setTitle("Experience & Level Progression")
      .setAuthor(member.user.tag, member.user.avatarURL({ dynamic: true, format: "png" }))
      .addField("Rank", `${data.rank}/${data.total_users}`, true)
      .addField("Level", data.lvl, true)
      .addField("Experience", `${data.remaining_xp}/${data.level_xp} XP`, true)
      .addField("Total Experience", `${data.total_xp} XP`, true);
    msg.channel.send(embed);
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [Number, new Optional(Duration)], staff: true, aliases: ["asm"], description: commandDescriptions.activateservermultiplier, usage: "<multiplier> [duration]" })
  async activateservermultiplier(msg: Message, multiplier: number, duration?: Duration): Promise<void> {
    await msg.delete();
    const xpmultiplier = await XPMultiplier.create({
      type: "server",
      multiplier: multiplier,
      endDate: duration ? new Date(Math.round(Date.now()) + duration.duration) :  null
    }).save();
    msg.channel.send(strings.general.success(strings.modules.levels.multiplierCreated(xpmultiplier.type, "server", multiplier, xpmultiplier.endDate)));
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [User, Number, new Optional(Duration)], staff: true, aliases: ["aum"], description: commandDescriptions.activateusermultiplier, usage: "<user:user> <multiplier> [duration]" })
  async activateusermultiplier(msg: Message, user: User, multiplier: number, duration?: Duration): Promise<void> {
    await msg.delete();
    const xpmultiplier = await XPMultiplier.create({
      type: "user",
      multiplier: multiplier,
      thingID: user.id,
      endDate: duration ? new Date(Math.round(Date.now()) + duration.duration) :  null
    }).save();
    msg.channel.send(strings.general.success(strings.modules.levels.multiplierCreated(xpmultiplier.type, user, multiplier, xpmultiplier.endDate)));
  }


  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], args: [Role, Number, new Optional(Duration)], staff: true, aliases: ["arm"], description: commandDescriptions.activaterolemultiplier, usage: "<role:role> <multiplier> [duration]" })
  async activaterolemultiplier(msg: Message, role: Role, multiplier: number, duration?: Duration): Promise<void> {
    await msg.delete();
    const xpmultiplier = await XPMultiplier.create({
      type: "role",
      multiplier: multiplier,
      thingID: role.id,
      endDate: duration ? new Date(Math.round(Date.now()) + duration.duration) :  null
    }).save();
    msg.channel.send(strings.general.success(strings.modules.levels.multiplierCreated(xpmultiplier.type, role, multiplier, xpmultiplier.endDate)), { allowedMentions: { roles: [] } });
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [String, new Optional(String), new Optional(String)], group: CommandCategories["Server Administrator"], staff: true, description: commandDescriptions.multiplier, usage: "<exhaust|list> [user|server|role] [user]" })
  async multiplier(msg: Message, what?: "exhaust" | "list", type?: "user" | "server" | "role", id?: string): Promise<Message> {
    await msg.delete();
    if (!["exhaust", "list"].includes(what)) return msg.channel.send(strings.general.error(strings.general.commandSyntax("e!multiplier <exhaust|list> [user|server] [user]")));

    if (what === "exhaust") {
      if (!type || !["user", "server"].includes(type)) return msg.channel.send(strings.general.error(strings.general.commandSyntax("e!multiplier <exhaust|list> [user|server] [user]")));
      if (type === "user") {
        if (!id) return msg.channel.send(strings.general.error(strings.modules.levels.missingUserId));
        const multiplier = await XPMultiplier.findOne({ where: { thingID: id, type: "user" } });
        if (!multiplier) return msg.channel.send(strings.general.error(strings.modules.levels.noMultiplierFound));
        multiplier.remove();
        msg.channel.send(strings.general.success(strings.modules.levels.removedMultiplier));
      } else if (type === "server") {
        const multipliers = await XPMultiplier.find({ where: { type: "server" } });
        await multipliers.map(m => m.remove());
        msg.channel.send(strings.general.success(strings.modules.levels.removedMultiplier));
      } else if (type === "role") {
        if (!id) return msg.channel.send(strings.general.error(strings.modules.levels.missingRoleId));
        const multiplier = await XPMultiplier.findOne({ where: { thingID: id, type: "role" } });
        if (!multiplier) return msg.channel.send(strings.general.error(strings.modules.levels.noMultiplierFound));
        multiplier.remove();
        msg.channel.send(strings.general.success(strings.modules.levels.removedMultiplier));
      }
    } else if (what === "list") {
      const serverMultipliers = await XPMultiplier.find({ where: { type: "server" } });
      const userMultipliers = await XPMultiplier.find({ where: { type: "user" } });
      const roleMultipliers = await XPMultiplier.find({ where: { type: "role" } });
      const embed = new Embed()
        .addField(strings.modules.levels.multiplierEmbedName("Server"), serverMultipliers.map(s => strings.modules.levels.multiplierMapping(s)).join("\n▬▬▬\n") || strings.modules.levels.noMultipliers)
        .addField(strings.modules.levels.multiplierEmbedName("User"), userMultipliers.map(u => strings.modules.levels.multiplierMapping(u)).join("\n▬▬▬\n") || strings.modules.levels.noMultipliers)
        .addField(strings.modules.levels.multiplierEmbedName("Role"), roleMultipliers.map(u => strings.modules.levels.multiplierMapping(u)).join("\n▬▬▬\n") || strings.modules.levels.noMultipliers);
      return msg.channel.send(embed);
    }
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [Role, Number], group: CommandCategories["Server Administrator"], staff: true, description: commandDescriptions.addlevelledrole, usage: "<role:role> <level:number>", aliases: ["alr"] })
  async addlevelledrole(msg: Message, role: Role, level: number): Promise<Message> {
    if (await LevelRole.findOne({ where: { id: role.id } })) return msg.channel.send(strings.general.error(strings.modules.levels.levelRole.alreadyRegistered));
    await LevelRole.create({
      id: role.id,
      level: level
    }).save();
    return msg.channel.send(strings.general.success(strings.modules.levels.levelRole.add(role, level)), { allowedMentions: { roles: [] } });
  }

  @command({ inhibitors: [inhibitors.adminOnly], args: [Role], group: CommandCategories["Server Administrator"], staff: true, description: commandDescriptions.removelevelledrole, usage: "<role:role>", aliases: ["rlr"] })
  async removelevelledrole(msg: Message, role: Role): Promise<Message> {
    if (!await LevelRole.findOne({ where: { id: role.id } })) return msg.channel.send(strings.general.error(strings.modules.levels.levelRole.doesNotExist));
    const levelrole = await LevelRole.findOne({ where: { id: role.id } });
    await levelrole.remove();
    return msg.channel.send(strings.general.success(strings.modules.levels.levelRole.remove(role)), { allowedMentions: { roles: [] } });
  }

  @command({ inhibitors: [inhibitors.adminOnly], group: CommandCategories["Server Administrator"], staff: true, description: commandDescriptions.listlevelledroles, aliases: ["llr"] })
  async listlevelledroles(msg: Message): Promise<Message> {
    const levelroles = await LevelRole.find();
    const embed = new Embed()
      .setAuthor(strings.modules.levels.levelRole.levelledRolesEmbedTitle)
      .setDescription(levelroles.map(r => `→ **<@&${r.id}>** \`➔\` **LEVEL ${r.level}**`).join("\n") || strings.modules.levels.levelRole.noLevelledRoles)
      .setFooter(strings.modules.levels.levelRole.levelledRolesEmbedFooter);
    return msg.channel.send(embed);
  }
}

const userInfo = async (user: User) => {
  let xpData = await UserXP.findOne({ where: { id: user.id } });
  if (!xpData) xpData = await UserXP.create({ id: user.id }).save();
  let allData = await UserXP.find();
  allData = allData.sort((a, b) => b.xp - a.xp);
  const user_total_xp = xpData.xp;
  const user_lvl = levelConstants.getLevelFromXP(user_total_xp);
  let x = 0;

  for (let i = 0; i < user_lvl; i++) {
    x += levelConstants.getLevelXP(i);
  }
  const remaining_xp = user_total_xp - x;

  const level_xp = levelConstants.getLevelXP(user_lvl);

  return {
    total_xp: user_total_xp,
    lvl: user_lvl,
    remaining_xp: remaining_xp,
    level_xp: level_xp,
    rank: allData.findIndex(a => a.id === user.id) + 1,
    total_users: allData.length
  };
};