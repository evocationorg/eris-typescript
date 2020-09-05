export * from "./colors";
export * from "./emotes";
export * from "./env";

// eslint-disable-next-line no-useless-escape
export const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
export const messageLinkRegex = /^(?:https?):\/\/(?:(?:(?:canary|ptb)\.)?(?:discord|discordapp)\.com\/channels\/)(@me|\d+)\/(\d+)\/(\d+)$/g;

export enum CommandCategories {
  "Bot Owner" = "Bot Owner",
  "Informational" = "Informational",
  "Giveaways" = "Giveaways",
  "Server Administrator" = "Server Administrator",
  "Permission Node Negations" = "Permission Node Negations",
  "Purchasable Role Limitation" = "Purchasable Role Limitation"
}