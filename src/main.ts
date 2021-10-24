import { jsonDecode, jsonEncode } from "isaacscript-common/dist/functions/json";
import { v } from "./config";

// Register the mod
const mod: Mod = RegisterMod("Treasure Room Start", 1);

export default function main(): void {
  // Main callback
  mod.AddCallback(ModCallbacks.MC_POST_GAME_STARTED, postGameStarted);

  // Conditional callbacks
  if (ModConfigMenu !== undefined) {
    mod.AddCallback(ModCallbacks.MC_POST_GAME_STARTED, loadSettings);
    mod.AddCallback(ModCallbacks.MC_PRE_GAME_EXIT, saveSettings);
  }
}

// Validates that the mod's prerequisites are met before proceeding
function conditionsMet(): boolean {
  const game = Game();
  if (
    game.Difficulty === Difficulty.DIFFICULTY_GREED ||
    game.Difficulty === Difficulty.DIFFICULTY_GREEDIER
  ) {
    return false;
  }
  const seeds = game.GetSeeds();
  if (seeds.IsCustomRun()) {
    return false;
  }
  const player = Isaac.GetPlayer(0);
  if (player === undefined) {
    return false;
  }
  const playerType = player.GetPlayerType();
  if (
    playerType === PlayerType.PLAYER_EDEN ||
    playerType === PlayerType.PLAYER_EDEN_B
  ) {
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
    v.hasDesiredRoom = false;
    handleReseed();
  }
}

// Reseeds the current run until the player starts next to a desired room
function handleReseed() {
  const game = Game();
  const level = game.GetLevel();
  const roomIndices = [71, 83, 85, 97];
  while (!v.hasDesiredRoom) {
    for (const i of roomIndices) {
      const room = level.GetRoomByIdx(i).Data;
      if (room !== undefined && v.rooms.has(room.Type)) {
        v.hasDesiredRoom = true;
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
        v.rooms.add(room);
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
