// Initialize mod variables
export const v = {
  curse: LevelCurse.CURSE_NONE,
  curseList: [
    LevelCurse.CURSE_NONE,
    LevelCurse.CURSE_OF_LABYRINTH,
    LevelCurse.CURSE_OF_DARKNESS,
    LevelCurse.CURSE_OF_THE_LOST,
    LevelCurse.CURSE_OF_THE_UNKNOWN,
    LevelCurse.CURSE_OF_MAZE,
    LevelCurse.CURSE_OF_BLIND,
  ],
  isEdenEnabled: false,
  roomIndices: [71, 83, 85, 97],
  rooms: new Set<RoomType>(),
  settingsLoaded: false,
  version: "1.9",
};

// Apply default config
v.rooms.add(RoomType.ROOM_TREASURE);

// If Repentance is installed, enable planetarium support
if (REPENTANCE === true) {
  v.rooms.add(RoomType.ROOM_PLANETARIUM);
}

// Parameterized MCM setting helper
function addSetting(key: number, description: string, info: string) {
  if (ModConfigMenu !== undefined) {
    ModConfigMenu.AddSetting("TR Start", "General", {
      Type: ModConfigMenuOptionType.BOOLEAN,
      CurrentSetting: (): boolean => {
        return v.rooms.has(key);
      },
      Display: (): string => {
        let onOff = "Disabled";
        if (v.rooms.has(key)) {
          onOff = "Enabled";
        }
        return `${description}: ${onOff}`;
      },
      OnChange: (): void => {
        if (v.rooms.has(key)) {
          v.rooms.delete(key);
        } else {
          v.rooms.add(key);
        }
      },
      Info: [info],
    });
  }
}

// Initializes the mod's MCM entry and settings page
if (ModConfigMenu !== undefined) {
  // About tab
  ModConfigMenu.AddSpace("TR Start", "About");
  ModConfigMenu.AddText("TR Start", "About", () => {
    return "Treasure Room Start";
  });
  ModConfigMenu.AddSpace("TR Start", "About");
  ModConfigMenu.AddText("TR Start", "About", () => {
    return `Version ${v.version}`;
  });
  ModConfigMenu.AddSpace("TR Start", "About");
  ModConfigMenu.AddText("TR Start", "About", () => {
    return "by Siramok";
  });

  // General tab
  const curseNames = new Map<LevelCurse, string>([
    [LevelCurse.CURSE_NONE, "None"],
    [LevelCurse.CURSE_OF_LABYRINTH, "Curse of the Labyrinth"],
    [LevelCurse.CURSE_OF_DARKNESS, "Curse of Darkness"],
    [LevelCurse.CURSE_OF_THE_LOST, "Curse of the Lost"],
    [LevelCurse.CURSE_OF_THE_UNKNOWN, "Curse of the Unknown"],
    [LevelCurse.CURSE_OF_MAZE, "Curse of the Maze"],
    [LevelCurse.CURSE_OF_BLIND, "Curse of the Blind"],
  ]);
  ModConfigMenu.AddSetting("TR Start", "General", {
    Type: ModConfigMenuOptionType.NUMBER,
    CurrentSetting: (): number => {
      return v.curseList.indexOf(v.curse);
    },
    Minimum: 0,
    Maximum: v.curseList.length - 1,
    Display: (): string => {
      return `Force A Curse: ${curseNames.get(v.curse)}`;
    },
    OnChange: (currentNum: number | boolean | undefined): void => {
      v.curse = v.curseList[currentNum as number];
    },
    Info: [
      "Caution: Setting this to anything besides None will increase load times.",
    ],
  });
  addSetting(RoomType.ROOM_TREASURE, "Treasure Rooms", "");
  if (REPENTANCE === true) {
    addSetting(
      RoomType.ROOM_PLANETARIUM,
      "Planetarium Rooms",
      "Caution: You will experience long load times when starting runs if no other rooms are enabled.",
    );
  }
  addSetting(RoomType.ROOM_CURSE, "Curse Rooms", "");
  addSetting(RoomType.ROOM_SACRIFICE, "Sacrifice Rooms", "");
  addSetting(RoomType.ROOM_SHOP, "Shop Rooms", "");
  addSetting(
    RoomType.ROOM_LIBRARY,
    "Library Rooms",
    "Caution: You will experience long load times when starting runs if no other rooms are enabled.",
  );
  addSetting(
    RoomType.ROOM_DICE,
    "Dice Rooms",
    "Caution: You will experience long load times when starting runs if no other rooms are enabled.",
  );
  addSetting(
    RoomType.ROOM_ISAACS,
    "Isaac's Bedroom",
    "Caution: You will experience long load times when starting runs if no other rooms are enabled.",
  );

  // Tweaks tab
  ModConfigMenu.AddSetting("TR Start", "Tweaks", {
    Type: ModConfigMenuOptionType.BOOLEAN,
    CurrentSetting: (): boolean => {
      return v.isEdenEnabled;
    },
    Display: (): string => {
      let onOff = "Disabled";
      if (v.isEdenEnabled) {
        onOff = "Enabled";
      }
      return `Eden Support: ${onOff}`;
    },
    OnChange: (): void => {
      if (v.isEdenEnabled) {
        v.isEdenEnabled = false;
      } else {
        v.isEdenEnabled = true;
      }
    },
    Info: [
      "Caution: May consume extra Eden tokens. Only enable if you are okay with that!",
    ],
  });
}
