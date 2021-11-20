import { isGreedMode, onSetSeed } from "isaacscript-common";
import { jsonDecode, jsonEncode } from "isaacscript-common/dist/functions/json";
import { v } from "./config";

// Register the mod
const mod = RegisterMod("Treasure Room Start", 1);

export default function main(): void {
  // Main callback
  mod.AddCallback(ModCallbacks.MC_POST_GAME_STARTED, postGameStarted);

  // Conditional callbacks
  if (ModConfigMenu !== undefined) {
    mod.AddCallback(ModCallbacks.MC_POST_GAME_STARTED, loadSettings);
    mod.AddCallback(ModCallbacks.MC_PRE_GAME_EXIT, saveSettings);
  }
}

// Helper function for detecting if the player is Eden or Tainted Eden
function isEden(player: EntityPlayer): boolean {
  const character = player.GetPlayerType();

  return (
    character === PlayerType.PLAYER_EDEN ||
    character === PlayerType.PLAYER_EDEN_B
  );
}

// Validates that the mod's prerequisites are met before proceeding
function conditionsMet(): boolean {
  const player = Isaac.GetPlayer(0);
  if (player === undefined) {
    return false;
  }
  if (isEden(player) && !v.isEdenEnabled) {
    return false;
  }
  if (onSetSeed()) {
    return false;
  }
  if (isGreedMode()) {
    return false;
  }
  if (v.rooms.size === 0) {
    return false;
  }
  return true;
}

// Calls handleReseed if appropriate when a new run is started
function postGameStarted(isContinued: boolean) {
  if (!isContinued && conditionsMet()) {
    handleReseed();
  }
}

// Reseeds the current run until the player starts next to a desired room
function handleReseed() {
  const game = Game();
  const level = game.GetLevel();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const i of v.roomIndices) {
      const room = level.GetRoomByIdx(i).Data;
      if (room !== undefined && v.rooms.has(room.Type)) {
        return;
      }
    }
    Isaac.ExecuteCommand("reseed");
  }
}

// Decode and apply previous mod settings
function loadSettings() {
  if (mod.HasData()) {
    const serialized = Isaac.LoadModData(mod);
    const deserialized = jsonDecode(serialized);
    if (deserialized.get("version") === v.version) {
      v.rooms.clear();
      for (const room of deserialized.get("rooms")) {
        v.rooms.add(room as RoomType);
      }
    }
  }
}

// Encode and save current mod settings
function saveSettings() {
  const enabledRooms = [];
  for (const room of v.rooms.values()) {
    enabledRooms.push(room);
  }
  const toSave = {
    rooms: enabledRooms,
    version: v.version,
  };
  mod.SaveData(jsonEncode(toSave));
}
