import { jsonDecode, jsonEncode } from "isaacscript-common/dist/functions/json";
import { isGreedMode } from "isaacscript-common/dist/functions/util";
import { v } from "./config";

// Register the mod
const mod = RegisterMod("Treasure Room Start", 1);

// Register callbacks
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

// Validate that the prerequisites for execution are met
function conditionsMet(): boolean {
  const player = Isaac.GetPlayer(0);
  if (player === undefined) {
    return false;
  }
  if (isEden(player) && !v.isEdenEnabled) {
    return false;
  }
  const game = Game();
  const seeds = game.GetSeeds();
  if (seeds.IsCustomRun()) {
    return false;
  }
  if (isGreedMode()) {
    return false;
  }
  if (v.rooms.size === 0 && v.curse === LevelCurse.CURSE_NONE) {
    return false;
  }
  return true;
}

// Calls handleReseed if appropriate when a new run is started
function postGameStarted(isContinued: boolean) {
  if (!isContinued) {
    if (!v.settingsLoaded) {
      loadSettings();
    }
    if (conditionsMet()) {
      handleReseed();
    }
  }
}

// Reseeds the current run until the player starts next to a desired room
function handleReseed() {
  const game = Game();
  const level = game.GetLevel();
  let limit = v.reseedLimit;
  if (limit === 0) {
    limit = math.maxinteger;
  }
  let numReseeds = 0;
  while (numReseeds < limit) {
    numReseeds += 1;
    if (v.curse !== LevelCurse.CURSE_NONE) {
      const curses = level.GetCurses();
      const isCurseActive = (curses & v.curse) !== 0;
      if (!isCurseActive) {
        Isaac.ExecuteCommand("reseed");
        continue;
      }
      if (v.rooms.size === 0) {
        return;
      }
    }
    for (const i of v.roomIndices) {
      const roomDescriptor = level.GetRoomByIdx(i);
      const room = roomDescriptor.Data;
      if (room === undefined) {
        continue;
      }
      if (v.rooms.has(room.Type)) {
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
    const savedVersion = deserialized.get("version") as string;
    if (savedVersion === v.version) {
      const curse = deserialized.get("curse") as LevelCurse;
      v.curse = curse;
      const reseedLimit = deserialized.get("reseedLimit") as int;
      v.reseedLimit = reseedLimit;
      const rooms = deserialized.get("rooms") as RoomType[];
      v.rooms.clear();
      for (const room of rooms) {
        v.rooms.add(room);
      }
    }
  }
  v.settingsLoaded = true;
}

// Encode and save current mod settings
function saveSettings() {
  const enabledRooms = [];
  const rooms = v.rooms.values();
  for (const room of rooms) {
    enabledRooms.push(room);
  }
  const toSave = {
    curse: v.curse,
    reseedLimit: v.reseedLimit,
    rooms: enabledRooms,
    version: v.version,
  };
  const serialized = jsonEncode(toSave);
  mod.SaveData(serialized);
}
