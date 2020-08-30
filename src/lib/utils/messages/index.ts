/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { emotes, ROLES, timeFormatter } from "..";
import { PermissionResolvable, Snowflake, Message, User, GuildEmoji } from "discord.js";
import { Blacklist, Giveaway } from "../database/models";

export const strings = {
  general: {
    success: (text: string) => `${emotes.commandresponses.success} **SUCCES**: ${text}`,
    error: (text: string) => `${emotes.commandresponses.denial} **COMMAND INHIBITED**: ${text}`,
    commandSyntax: (text: string) => `Syntactic fallacy detected. **COMMAND SYNTAX**: \`${text}\``,
    somethingWentWrong: "Something went wrong."
  },
  giveaway: {
    embed: {
      footerEnded: (winnerAmount: number) => `${winnerAmount} Winner(s) | Ended on`,
      footer: (winnerAmount: number) => `${winnerAmount} Winner(s) | Ends on`,
      noWinner: `${emotes.commandresponses.denial} **EXECUTION FAILURE**: A winner was not able to be determined.`,
      giveawayEndedHeader: `${emotes.giveaway.giftmessage} **GIVEAWAY ENDED** ${emotes.giveaway.giftmessage}`,
      giveawayHeader: `${emotes.giveaway.giftmessage} **GIVEAWAY** ${emotes.giveaway.giftmessage}`,
      winners: (winners: string) => [
        "This giveaway was won by:",
        winners,
        "\nIf there are any complications in the delivery of the prize or an illegitimacy was identified, this prize may be rerolled."
      ].join("\n"),
      description: (duration: string) => [
        `React with ${emotes.giveaway.giftreaction} to enter!\n`,
        `**TIME REMAINING**: ${duration}\n`,
        `You __**MUST**__ have the **<@&${ROLES.MALLORN}>** role or above to enter giveaways. If you attempt to enter this giveaway without being Level 3 or above, your entrance will be nullified.`
      ].join("\n")
    },
    noWinner: (name: string) => `Nobody won **${name}**. Maybe next time...`,
    winners: (winners: string, name: string, messageLink: string) => `Congratulations ${winners}! You have won **${name}**. Please send a Direct Message to <@747105315840983212> with this message link to redeem your prize: <${messageLink}>. If we do not hear from you within **24** hours of this message being sent, the prize will be rerolled.`
  },
  arguments: {
    noArgumentSupplied: "No argument was supplied.",
    remainderBlank: "Remainder of the command is blank.",
    invalidDuration: "Invalid duration.",
    invalidNumber: "The argument must be a valid number.",
    couldNotFindGuildMember: "Could not find the GuildMember.",
    couldNotFindUser: "Could not find the User.",
    couldNotFindGuild: "Could not find the Guild.",
    couldNotFindTextChannel: "Could not find the TextChannel."
  },
  inhibitors: {
    noPermission: "You do not satisfy the predefined criteria to be able to perform this command.",
    notInGuild: "You are not in a guild.",
    missingDiscordPermission: (permission: PermissionResolvable) => `You miss a discord permission: ${permission}`,
    cooldown: (cooldown: string) => `You must wait ${cooldown} to run this command!`,
    requestRejected: "Request has been rejected. Please run this command in #bot-commands!"
  },
  modules: {
    directmessages: {
      embedFooter: (messageid: Snowflake) => `Message ID: ${messageid}`,
      embedAuthor: (message: Message) => `${message.author.tag} (${message.author.id})`,
      attachments: "Attachments",
      directMessageReceived: `${emotes.logging.messagecreation} **DIRECT MESSAGE RECEIVED`,
      directMessageEdited: `${emotes.logging.messageedit} **DIRECT MESSAGE EDITED`,
      directMessageDeleted: `${emotes.logging.messagedeletion} **DIRECT MESSAGE DELETED`,
      originalMessage: "Original Message",
      orignalContentError: "Old Message content couldn't be fetched.",
      editedMessage: "Edited Message",
      commands: {
        directMessageSentExecution: (message: Message, user: User) => `${emotes.logging.messagecreation} **\`${message.author.tag}\`** (\`${message.author.id}\`) ran an administrative command in ${message.channel} (\`${message.channel.id}\`), forcing me to send a Direct Message to **\`${user.tag}\`** (\`${user.id}\`).`,
        directMessageDeleteExecution: (message: Message, user: User) => `${emotes.logging.messagedeletion} **\`${message.author.tag}\`** (\`${message.author.id}\`) ran an administrative command in ${message.channel} (\`${message.channel.id}\`), forcing me to delete a Direct Message that was previously sent to **\`${user.tag}\`** (\`${user.id}\`).`,
        directMessageSent: (user: User, content: string) => `Direct Message has been sent to **\`${user.tag}\`** (\`${user.id}\`) - **${content}**.`,
        directMessageDeleted: (user: User, content: string) => `Direct Message to **\`${user.tag}\`** (\`${user.id}\`) has been deleted - **${content}**.`
      }
    },
    donations: {
      auditLogWhiteHallowsAdd: "[FORCED REVOCATION] Authenticity cannot be verified.",
      commands: {
        logdonationBotError: "The identifier you inputted is attributed to that of a bot. Please only use this command for its intended purpose.",
        logdonationAlreadyWhiteHallows: (user: User) => `I have logged this donation; ${user} already has the **<@&${ROLES.WHITE_HALLOWS}>** role.`,
        logdonationNewWhiteHallows: (user: User) => `I have logged this donation and awarded ${user} with the **<@&${ROLES.WHITE_HALLOWS}>** role.`,
        logdonationLogEntry: (user: User, item: string, executor: User) => `\`[${timeFormatter()}]\` ${emotes.giveaway.donation} **\`${user.tag}\`** (\`${user.id}\`) donated **${item}**. This donation was logged by **\`${executor.tag}\`** (\`${executor.id}\`).`
      }
    },
    emojis: {
      emojiAdded: (emoji: GuildEmoji) => `${emotes.uncategorised.enter} **EMOJI ADDED**: ${emoji} \`:${emoji.name}:\``,
      emojiUpdated: (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => `${emotes.uncategorised.enter} **EMOJI RENAMED**: ${newEmoji} \`:${oldEmoji.name}:\` → \`:${newEmoji.name}:\``,
      emojiDeleted: (emoji: GuildEmoji) => `${emotes.uncategorised.leave} **EMOJI REMOVED**: \`:${emoji.name}:\``,
    },
    events: {
      announcementMessages: (message: Message) => `\`[${timeFormatter(new Date(message.createdTimestamp))}]\` **\`[PUBLICATION NOTICE]\`** <:information:747497420954534050> **\`${message.author.tag}\`** (\`${message.author.id}\`) sent a message (\`${message.id}\`) in ${message.channel} (\`${message.channel.id}\`) that was automatically published. **MESSAGE LINK**: <https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}>`
    },
    exclusions: {
      cantAddRoleToExclusions: "You cannot add that role as an exclusion as it would constitute your exclusion, too.",
      cantExcludeYourself: "You cannot execute that command on yourself",
      executedExclusions: (type: "role" | "user") => `Executed exclusions for the specified ${type}.`,
      exclusionEmbedName: (type: "Role" | "User") => `${type} Exclusions`,
      noUsersExcluded: "→ No users excluded.",
      noRolesExcluded: "→ No roles excluded.",
      exclusionMapping: (ur: Blacklist) => `→ <@${ur.type === "user" ? "&" : ""}${ur.id}> (\`${ur.id}\`)`,
      roleNotExcluded: "This role is not excluded",
      userNotExcluded: "This user is not excluded",
      updatedExclusionsForRole: "Updated exclusions for the specified role.",
      updatedExclusionsForUser: "Updated exclusions for the specified user.",
      removedAllExclusions: "Removed all exclusions.",
      roleNotResolved: "Role was not able to be resolved.",
      userNotResolved: "User was not able to be resolved.",
    },
    giveaway: {
      loadingMessage: "Loading...",
      notValidMessageID: "That is not a valid message ID! Try running without an ID to use the most recent giveaway in this channel.",
      noGiveawayMessageLinked: "The message you linked is not a giveaway message!",
      rerollNewWinner: (name: string, winner: User, messageLink: string) => [
        `The new winner of **${name}** is ${winner}.`,
        `**MESSAGE LINK**: <${messageLink}>`
      ].join("\n"),
      noRecentGiveawaysFound: "I couldn't find any recent giveaways in this channel.",
      giveawayAlreadyEnded: "Giveaway has already ended.",
      mostRecentGiveawayAlreadyEnded: "The most recent giveaway in this channel has already ended",
      noCurrentActiveGiveaway: "There are currently no active giveaways on the server",
      giveawayListMap: (index: number, giveaway: Giveaway) => `\`${index + 1}.\` **\`[CREATION]\`** \`[${timeFormatter(giveaway.startTime)}]\` **${giveaway.prize}** in <#${giveaway.channelId}> (\`${giveaway.channelId}\`). Started by **<@${giveaway.startedBy}>** (\`${giveaway.startedBy}\`). Ends at \`${timeFormatter(giveaway.endTime)}\`.`,
      giveawayEndedMap: (index: number, giveaway: Giveaway) => `\`${index + 1}.\` **\`[CREATION]\`** \`[${timeFormatter(giveaway.startTime)}]\` **${giveaway.prize}** in <#${giveaway.channelId}> (\`${giveaway.channelId}\`). Started by **<@${giveaway.startedBy}>** (\`${giveaway.startedBy}\`). Ended at \`${timeFormatter()}\`.`,
      activeGiveaways: `${emotes.giveaway.giftmessage} **ACTIVE GIVEAWAYS**`,
      endedGivewaways: `${emotes.giveaway.giftmessage} **ENDED GIVEAWAYS**`,
    },
    help: {
      unknownCategory: "Unknown Category",
      specificCommandHelp: `To get more information about a specific command, run \`${process.env.PREFIX}help [command]\`.`,
      noPermission: "I cannot retrieve additional information about this command as you do not satisfy its permission criteria",
      noCommandFound: "No command exists with that name or alias. Please reinspect its spelling, as that may be a potential factor as to why it cannot be resolved.",
      noArgumentsNeeded: "No arguments need to be either mandatorily or optionally provided for this command.",
      noAliases: "No aliases exist for this command.",
      noDescription: "No description found."
    },
    logging: {
      administrativeCommand: (msg: Message, cmdTrigger: string, stringArgs: string[]) => `\`[${timeFormatter()}]\` **\`[ADMINISTRATIVE]\`** ${emotes.logging.administrativeaudit} **\`${msg.author.tag}\`** (\`${msg.author.id}\`) performed \`${cmdTrigger}\` (\`${msg.id}\`)${stringArgs.length > 0 ? ` with args: \`${stringArgs.join(" ")}\`` : ""} in ${msg.channel} (\`${msg.channel.id}\`).`,
      command: (msg: Message, cmdTrigger: string, stringArgs: string[]) => `\`[${timeFormatter()}]\` ${emotes.logging.audit} **\`${msg.author.tag}\`** (\`${msg.author.id}\`) performed \`${cmdTrigger}\` (\`${msg.id}\`)${stringArgs.length > 0 ? ` with args: \`${stringArgs.join(" ")}\`` : ""} in ${msg.channel} (\`${msg.channel.id}\`).`,
      linkResolver: (msg: Message, link: string, resLink: string) => [
        `\`[${timeFormatter()}]\` **\`[LINK REDIRECT RESOLVER]\`** ${emotes.logging.linkresolver} **\`${msg.author.tag}\`** (\`${msg.author.id}\`) sent a message (\`${msg.id}\`) containing a redirection-based link in ${msg.channel} (\`${msg.channel.id}\`).\n`,
        `**UNRESOLVED LINK**: <${link}>`,
        `**RESOLVED LINK**: <${resLink}>\n`,
        "No automatic action has been taken against their account or the message itself. Please review the above to ensure that the link is not violative of Evocation's regulations."
      ].join("\n"),
      userUpdate: (oldUser: User, newUser: User) => `\`[${timeFormatter()}]\` ${emotes.logging.nameupdate} User with ID \`${newUser.id}\` (${newUser}>) has changed their Discord username: \`**[${oldUser.username}]**\` → \`**[${newUser.username}]**\`.`
    },
    permissions: {
      negations: (type: "Reaction" | "Art" | "Media" | "Experience") => `${type} negations have been executed for the specified users.`
    },
    util: {
      statusError: "Status needs to be `online`, `dnd`, `idle` or `invisible`.",
      statusSet: (status: string) => `My status is now **${status}**.`,
      gameError: "Type needs to be `watching`, `playing` or `listening`.",
      gameSet: (type: "watching" | "playing" | "listening", game: string) => `I am now ${type}${type === "listening" ? " to" : ""} **${game}**.`,
      linkDoesNotMatchDiscordLink: "Link doesnt match a discord message link",
      guildWasNotFound: (id: string) => `Guild with ID ${id} was not found.`,
      channelWasNotFound: (id: string) => `Channel with ID ${id} was not found.`,
      messageWasNotFound: (id: string) => `Message with ID ${id} was not found.`,
      messageEdited: "Message has been edited.",
      shutdown: "I can feel my Drearian Spirit fading...",
      aboutCommand: [
        "Hi! I am a custom bot designed for exclusive use by Evocation staff and members. An impermeable forcefield that surrounds the universe of Evocation prohibits me from being able to join and interact with other servers.\n",
        "__**CONTRIBUTORS**__\n",
        "**DEVELOPMENT TEAM LEAD**: <@209609796704403456>",
        "**DEVELOPER**: <@222073294419918848>",
        "**CHARACTER CONCEPTUALIST**: <@369497100834308106>"
      ].join("\n")
    }
  },
  commandGroups: {  }
};
