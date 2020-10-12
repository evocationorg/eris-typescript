const ROLES = {
  HYPERION: process.env.WHITE_HALLOWS,
  SENTRIES_OF_DESCENSUS: process.env.SENTRIES_OF_DESCENSUS_ROLE,
  SCIONS_OF_ELYSIUM: process.env.SCIONS_OF_ELYSIUM_ROLE,
  ORION: process.env.EVOCATION_OCULI_ROLE,
  CHRONOS: process.env.EVOCATION_LACUNAE_ROLE,
  DRAKEFEATHER: process.env.DRAKEFEATHER_ROLE,
  LIFEROOT: process.env.LIFEROOT_ROLE,
  LICHBLOOM: process.env.LICHBLOOM_ROLE,
  STROLUS: process.env.STROLUS_ROLE,
  DREAMFOIL: process.env.DREAMFOIL_ROLE,
  RIVERBUD: process.env.RIVERBUD_ROLE,
  MALLORN: process.env.MALLORN_ROLE,
  STAFF: process.env.STAFF_ROLE,
  MODERATOR: process.env.MODERATOR_ROLE,
  ADMINISTRATORS: process.env.ADMINISTRATORS_ROLE,
  LEAD_ADMINISTRATORS: process.env.LEAD_ADMINISTRATORS_ROLE,
  HYACINTH: process.env.HYACINTH_ROLE,
  EOS: process.env.WISTERIA_ROLE,
  EVOCATION_MIRACULUM: process.env.EVOCATION_MIRACULUM,
  AFFILIATE: process.env.AFFILIATE_ROLE,
  SERVER_GROWTH_LEAD: process.env.SERVER_GROWTH_LEAD,
  ERIS_DEVELOPER: process.env.ERIS_DEVELOPER_ROLE
};

const CHANNELS = {
  DONATION_LOG: process.env.DONATION_LOG,
  DIRECT_MESSAGE_LOG: process.env.DIRECT_MESSAGE_LOG,
  ERIS_LOG: process.env.ERIS_LOG,
  PERIPHERAL_ANNOUNCEMENTS: process.env.PERIPHERAL_ANNOUNCEMENTS,
  MODERATION_LOG: process.env.MODERATION_LOG,
  DENOMINATION_LOG: process.env.DENOMINATION_LOG,
  ERIS_SYSTEM_LOG: process.env.ERIS_SYSTEM_LOG,
  AFFILIATE_LOUNGE: process.env.AFFILIATE_LOUNGE,
  EMOJI_LOG: process.env.EMOJI_LOG,
  LOUNGE: process.env.LOUNGE_CHANNEL
};

const NEGATIONS = {
  EXPERIENCE: process.env.NEGATION_EXPERIENCE,
  MEDIA: process.env.NEGATION_MEDIA,
  REACTIONS: process.env.NEGATION_REACTIONS,
  ART: process.env.NEGATION_ART,
  FEEDBACK: process.env.NEGATION_FEEDBACK
};

const DATABASE_INFO = {
  HOST: process.env.DB_HOST,
  DATABASE: process.env.DB_DATABASE,
  USERNAME: process.env.DB_USERNAME,
  PASSWORD: process.env.DB_PASSWORD,
};

const MAIN_GUILD_ID = process.env.MAIN_GUILD_ID;

export default {
  ROLES,
  CHANNELS,
  NEGATIONS,
  DATABASE_INFO,
  MAIN_GUILD_ID
};