// Initialize mod variables
export const v = {
  isEdenEnabled: false,
  roomIndices: [71, 83, 85, 97],
  rooms: new Set<RoomType>(),
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
  const newSetting: ModConfigMenuSetting = {
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
    Info: [info],
    OnChange: (): void => {
      if (v.rooms.has(key)) {
        v.rooms.delete(key);
      } else {
        v.rooms.add(key);
      }
    },
    Type: ModConfigMenuOptionType.BOOLEAN,
  };
  if (ModConfigMenu !== undefined) {
    ModConfigMenu.AddSetting("TR Start", "General", newSetting);
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
  const newSetting: ModConfigMenuSetting = {
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
    Info: [
      "Caution: May consume extra Eden tokens. Only enable Eden support if you are okay with that!",
    ],
    OnChange: (): void => {
      if (v.isEdenEnabled) {
        v.isEdenEnabled = false;
      } else {
        v.isEdenEnabled = true;
      }
    },
    Type: ModConfigMenuOptionType.BOOLEAN,
  };
  if (ModConfigMenu !== undefined) {
    ModConfigMenu.AddSetting("TR Start", "Tweaks", newSetting);
  }
}
