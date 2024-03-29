/* eslint-disable max-classes-per-file */
import Discord from "discord.js";
import strings from "@utils/messages";
import ArgTextProcessor from "./ArgumentProcessor";
import { supportedArgs, allParsers } from "./supportedArgs";

// Handles remainder parsing.
export class Remainder {
  // Defines the type.
  private type: supportedArgs;

  // Constructs the class.
  constructor(type: supportedArgs) {
    this.type = type;
  }

  // Handle the parsing of this.
  async parse(parser: ArgTextProcessor, msg: Discord.Message): Promise<unknown[]> {
    // Get the parser for the type.
    const typeParser = allParsers.get(this.type);

    // Get the remainder.
    const remainder = parser.remainder();
    if (remainder === "") {
      // Argument is blank.
      throw new Error(strings.errors.arguments.remainderBlank);
    }

    // Call the parser.
    return [await typeParser(remainder, msg)];
  }
}

// Handle optional arguments.
export class Optional {
  // Defines the arg.
  private arg: supportedArgs | Remainder;

  // Constructs the class.
  constructor(arg: supportedArgs | Remainder) {
    this.arg = arg;
  }

  // Handles the parsing.
  async parse(parser: ArgTextProcessor, msg: Discord.Message): Promise<unknown[]> {
    try {
      // Return all transformed arguments.
      return await getArgumentParser(this.arg)(parser, msg);
    } catch (_) {
      // Return a blank array.
      return [];
    }
  }
}

export const getArgumentParser = (arg: supportedArgs | Remainder | Optional): ((parser: ArgTextProcessor, msg: Discord.Message) => Promise<unknown[]>) => {
  // Return the parser.
  if (arg instanceof Remainder || arg instanceof Optional) return async (parser: ArgTextProcessor, msg: Discord.Message): Promise<unknown[]> => arg.parse.bind(arg)(parser, msg);

  // Get the parser for individual arguments.
  const transformer = allParsers.get(arg);

  // Handle the parsing.
  return async (parser: ArgTextProcessor, msg: Discord.Message): Promise<unknown[]> => [await parser.one(transformer, msg)];
};
