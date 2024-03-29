export default {
  link: /https?:\/\/(www\.)?[\w#%+.:=@~-]{2,256}\.[a-z]{2,4}\b([\w#%&+./:=?@~-]*)/g,
  messageLink: /(?:https?)?:\/\/(?:(?:ptb|canary|development)\.)?discord(?:app)?\.com\/channels\/(\d{15,21})\/(\d{15,21})\/(\d{15,21})\/?/,
  messageLinkg: /(?:https?)?:\/\/(?:(?:ptb|canary|development)\.)?discord(?:app)?\.com\/channels\/(\d{15,21})\/(\d{15,21})\/(\d{15,21})\/?/g,
  reply: /Replying to (?:<@!?\d+> from )?(?:ht{2}ps?)?:\/{2}(?:(?:ptb|canary|development)\.)?discord(?:ap{2})?\.com\/chan{2}els(?:\/\d{15,21}){3}\/?/,
  user: /^(?:<@!?)?(\d{17,19})>?$/,
  role: /^(?:<@&)?(\d{17,19})>?$/,
  channel: /^(?:<#)?(\d{17,19})>?$/
};

export function escapeRegex(str: string): string {
  return str.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
}
export function regExpEsc(str: string): string {
  return str.replace(/[$()*+./?[\\\]^{|}-]/g, "\\$&");
}
