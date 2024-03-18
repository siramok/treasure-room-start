// Modified from: https://github.com/Zamiell/babies-mod/blob/main/src/modConfigMenu.ts

import { ModConfigMenuOptionType } from "isaac-typescript-definitions";
import { MCM_NAME as CATEGORY_NAME, MCM_NAME } from "./constants";
import { mod } from "./mod";

type ConfigDescription = readonly [
  configName: keyof Config,
  optionType: ModConfigMenuOptionType,
  title: string,
  description: string,
];

type ConfigDescriptions = readonly ConfigDescription[];

class Config {
  // Room Types.
  enableBedroomRoomType = false;
  enableCurseRoomType = false;
  enableDiceRoomType = false;
  enableLibraryRoomType = false;
  enableMinibossRoomType = false;
  enablePlanetariumRoomType = true;
  enableSacrificeRoomType = false;
  enableSecretRoomType = false;
  enableShopRoomType = false;
  enableTreasureRoomType = true;
  // Curse Types.
  enableLevelCurseBlind = false;
  enableLevelCurseDarkness = false;
  enableLevelCurseLabyrinth = false;
  enableLevelCurseLost = false;
  enableLevelCurseMaze = false;
  enableLevelCurseUnknown = false;
  // Settings.
  enableLevelCurses = true;
  enableModdedCharacters = true;
}

const ROOM_CONFIG_DESCRIPTIONS = [
  [
    "enableBedroomRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Bedrooms",
    "Restart the run until the player spawns next to a bedroom.",
  ],
  [
    "enableCurseRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse Rooms",
    "Restart the run until the player spawns next to a curse room.",
  ],
  [
    "enableDiceRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Dice Rooms",
    "Restart the run until the player spawns next to a dice room.",
  ],
  [
    "enableLibraryRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Libraries",
    "Restart the run until the player spawns next to a library.",
  ],
  [
    "enableMinibossRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Miniboss Rooms",
    "Restart the run until the player spawns next to a library.",
  ],
  [
    "enablePlanetariumRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Planetariums",
    "Restart the run until the player spawns next to a planetarium.",
  ],
  [
    "enableSacrificeRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Sacrifice Rooms",
    "Restart the run until the player spawns next to a sacrifice room.",
  ],
  [
    "enableSecretRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Secret Rooms",
    "Restart the run until the player spawns next to a secret room.",
  ],
  [
    "enableShopRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Shops",
    "Restart the run until the player spawns next to a shop.",
  ],
  [
    "enableTreasureRoomType",
    ModConfigMenuOptionType.BOOLEAN,
    "Treasure Rooms",
    "Restart the run until the player spawns next to a treasure room.",
  ],
] as const satisfies ConfigDescriptions;

const CURSE_CONFIG_DESCRIPTIONS = [
  [
    "enableLevelCurseBlind",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of the Blind",
    "All item sprites are replaced with a question mark and are not revealed until they are picked up.",
  ],
  [
    "enableLevelCurseDarkness",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of Darkness",
    "The floor is much darker, and is only barely lit by Isaac's natural aura.",
  ],
  [
    "enableLevelCurseLabyrinth",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of the the Labyrinth",
    "Merges the first two floors of a chapter into one.",
  ],
  [
    "enableLevelCurseLost",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of the the Lost",
    "Removes the map from the HUD.",
  ],
  [
    "enableLevelCurseMaze",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of the the Maze",
    "Entering a new room will occasionally take Isaac to the wrong room.",
  ],
  [
    "enableLevelCurseUnknown",
    ModConfigMenuOptionType.BOOLEAN,
    "Curse of the the Unknown",
    "Removes Isaac's health from the HUD.",
  ],
] as const satisfies ConfigDescriptions;

const SETTINGS_CONFIG_DESCRIPTIONS = [
  [
    "enableLevelCurses",
    ModConfigMenuOptionType.BOOLEAN,
    "Allow Starting Curses",
    "Disable to prevent new runs from having level curses. Overrides any enabled curses on the other page.",
  ],
  [
    "enableModdedCharacters",
    ModConfigMenuOptionType.BOOLEAN,
    "Modded Character Support",
    "Disable support for modded characters if you are experiencing compatibility issues.",
  ],
] as const satisfies ConfigDescriptions;

const v = {
  persistent: {
    config: new Config(),
  },
};

export const { config } = v.persistent;

export function initModConfigMenu(): void {
  mod.saveDataManager("modConfigMenu", v);

  if (ModConfigMenu === undefined) {
    return;
  }

  deleteOldConfig(CATEGORY_NAME);

  registerSubMenuConfig("Rooms", ROOM_CONFIG_DESCRIPTIONS);
  registerSubMenuConfig("Curses", CURSE_CONFIG_DESCRIPTIONS);
  registerSubMenuConfig("Settings", SETTINGS_CONFIG_DESCRIPTIONS);
}

function deleteOldConfig(categoryName: string) {
  if (ModConfigMenu === undefined) {
    return;
  }

  const categoryID = ModConfigMenu.GetCategoryIDByName(categoryName);
  if (categoryID !== undefined) {
    ModConfigMenu.MenuData.set(categoryID, {
      Name: MCM_NAME,
      Subcategories: [],
    });
  }
}

function registerSubMenuConfig(
  subMenuName: string,
  configDescriptions: ConfigDescriptions,
) {
  if (ModConfigMenu === undefined) {
    return;
  }

  for (const [
    configName,
    optionType,
    title,
    description,
  ] of configDescriptions) {
    ModConfigMenu.AddSetting(CATEGORY_NAME, subMenuName, {
      Type: optionType,
      CurrentSetting: () => config[configName],
      Display: () => getDisplayTextBoolean(configName, title),
      OnChange: (newValue: number | boolean | undefined) => {
        if (newValue === undefined) {
          return;
        }

        config[configName] = newValue as boolean;
        mod.saveDataManagerSave();
      },
      Info: [description],
    });
  }
}

function getDisplayTextBoolean(
  configName: keyof Config,
  shortDescription: string,
): string {
  const currentValue = config[configName];
  return `${shortDescription}: ${onOff(currentValue)}`;
}

function onOff(setting: boolean): string {
  return setting ? "ON" : "OFF";
}
