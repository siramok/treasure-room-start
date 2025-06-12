import { LevelCurse, RoomType } from "isaac-typescript-definitions";
import {
  CallbackCustom,
  ModCallbackCustom,
  ModFeature,
  game,
  getRoomTypeName,
  getTime,
  hasCurse,
  isModdedCharacter,
  isRoomType,
} from "isaacscript-common";
import { LOG_HEADER } from "../../constants";
import { config } from "../../modConfigMenu";

export class StartNewRun extends ModFeature {
  hasEnabledCurseTypes = false;

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, false)
  postGameStartedReorderedFalse(): void {
    const startTime = getTime();

    const player = Isaac.GetPlayer();
    const character = player.GetPlayerType();

    // If the user has disabled support for modded characters but is playing a modded character,
    // exit early.
    if (!config.enableModdedCharacters && isModdedCharacter(character)) {
      print(
        `${LOG_HEADER} exiting early, user has disabled support for modded characters.`,
      );
      return;
    }

    const enabledRoomTypes = this.getEnabledRoomTypes();
    const enabledCurseTypes = this.getEnabledCurseTypes();

    // Handle Beyond mod custom characters.
    if (BeyondMod !== undefined) {
      // Sin replaces treasure rooms with devil rooms, so we search for those instead.
      if (character === Isaac.GetPlayerTypeByName("Sin", false)) {
        print(
          `${LOG_HEADER} playing as "Sin" from the Beyond mod. Searching for ${getRoomTypeName(RoomType.DEVIL)}s instead of ${getRoomTypeName(RoomType.TREASURE)}s.`,
        );
        if (enabledRoomTypes.has(RoomType.TREASURE)) {
          enabledRoomTypes.delete(RoomType.TREASURE);
          enabledRoomTypes.add(RoomType.DEVIL);
        }
        enabledRoomTypes.delete(RoomType.PLANETARIUM);
      }

      // The Atoned replaces treasure rooms with angel rooms, so we search for those instead.
      if (character === Isaac.GetPlayerTypeByName("Sin", true)) {
        print(
          `${LOG_HEADER} playing as "The Atoned" from the Beyond mod. Searching for ${getRoomTypeName(RoomType.ANGEL)}s instead of ${getRoomTypeName(RoomType.TREASURE)}s.`,
        );
        if (enabledRoomTypes.has(RoomType.TREASURE)) {
          enabledRoomTypes.delete(RoomType.TREASURE);
          enabledRoomTypes.add(RoomType.ANGEL);
        }
        enabledRoomTypes.delete(RoomType.PLANETARIUM);
      }

      // The Husk replaces treasure rooms with a custom room type, so we won't search for them.
      if (character === Isaac.GetPlayerTypeByName("The Rotten", true)) {
        print(
          `${LOG_HEADER} playing as "The Husk" from the Beyond mod. Won't search for ${getRoomTypeName(RoomType.TREASURE)}s, ${getRoomTypeName(RoomType.PLANETARIUM)}s, or ${getRoomTypeName(RoomType.SHOP)}s since this character replaces them.`,
        );
        enabledRoomTypes.delete(RoomType.TREASURE);
        enabledRoomTypes.delete(RoomType.PLANETARIUM);
        enabledRoomTypes.delete(RoomType.SHOP);
      }
    }

    const noRoomTypesEnabled = enabledRoomTypes.size === 0;
    const noCurseTypesEnabled = enabledCurseTypes.size === 0;

    // If there's nothing to search for, exit early.
    if (noRoomTypesEnabled && noCurseTypesEnabled) {
      print(
        `${LOG_HEADER} exiting early, no room types or curses are enabled.`,
      );
      return;
    }

    // The mod doesn't make sense for greed mode, exit early.
    if (game.IsGreedMode()) {
      print(
        `${LOG_HEADER} exiting early, this mod does not support greed mode.`,
      );
      return;
    }

    // We don't want to reseed the run if the user manually entered a seed, exit early.
    const seeds = game.GetSeeds();
    if (seeds.IsCustomRun()) {
      print(
        `${LOG_HEADER} exiting early, this mod does not support custom runs.`,
      );
      return;
    }

    // 1000 iterations seems like a good sweet spot.
    const reseedLimit = 1000;
    // These are always the adjacent room IDs.
    const adjacentRoomIndices: readonly int[] = [71, 83, 85, 97];
    const level = game.GetLevel();

    // Only search a finite number of times to avoid crashing the game.
    for (let reseedIter = 0; reseedIter < reseedLimit; reseedIter++) {
      const cursed = hasCurse(...enabledCurseTypes);

      // Reseed if we are cursed but the user disabled starting curses.
      if (!config.enableLevelCurses && cursed) {
        Isaac.ExecuteCommand("reseed");
        continue;
      }

      // Handle curse types.
      if (!noCurseTypesEnabled) {
        // Reseed until we start with an enabled curse.
        if (!cursed) {
          Isaac.ExecuteCommand("reseed");
          continue;
        }

        // The user might want to start with a curse, but not next to a particular room type.
        if (noRoomTypesEnabled) {
          const stopTime = getTime();
          print(
            `${LOG_HEADER} spawned with an enabled curse type after ${reseedIter}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
          );
          return;
        }
      }

      // Iterate over the adjacent rooms to the starting room.
      for (const roomGridIndex of adjacentRoomIndices) {
        const roomDescriptor = level.GetRoomByIdx(roomGridIndex);
        const roomData = roomDescriptor.Data;
        if (roomData === undefined) {
          // Not sure if it's possible to have this case.
          continue;
        }
        if (isRoomType(roomData, ...enabledRoomTypes)) {
          const stopTime = getTime();
          print(
            `${LOG_HEADER} spawned adjacent to an enabled room type after ${reseedIter}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
          );
          return;
        }
      }
      Isaac.ExecuteCommand("reseed");
    }

    // If we couldn't find a suitable seed, stop searching and let the user know.
    const stopTime = getTime();
    print(
      `${LOG_HEADER} failed to find a run with the desired configuration after ${reseedLimit}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
    );
    print(
      `${LOG_HEADER} consider enabling more room types in your MCM settings for a faster start`,
    );
  }

  // Returns a set of enabled RoomTypes.
  getEnabledRoomTypes(): Set<RoomType> {
    const enabledRoomTypes = new Set<RoomType>();

    if (config.enableBedroomRoomType) {
      enabledRoomTypes.add(RoomType.CLEAN_BEDROOM);
      enabledRoomTypes.add(RoomType.DIRTY_BEDROOM);
    }

    if (config.enableCurseRoomType) {
      enabledRoomTypes.add(RoomType.CURSE);
    }

    if (config.enableDiceRoomType) {
      enabledRoomTypes.add(RoomType.DICE);
    }

    if (config.enableLibraryRoomType) {
      enabledRoomTypes.add(RoomType.LIBRARY);
    }

    if (config.enableMinibossRoomType) {
      enabledRoomTypes.add(RoomType.MINI_BOSS);
    }

    if (config.enablePlanetariumRoomType) {
      enabledRoomTypes.add(RoomType.PLANETARIUM);
    }

    if (config.enableSacrificeRoomType) {
      enabledRoomTypes.add(RoomType.SACRIFICE);
    }

    if (config.enableSecretRoomType) {
      enabledRoomTypes.add(RoomType.SECRET);
    }

    if (config.enableShopRoomType) {
      enabledRoomTypes.add(RoomType.SHOP);
    }

    if (config.enableTreasureRoomType) {
      enabledRoomTypes.add(RoomType.TREASURE);
    }

    return enabledRoomTypes;
  }

  // Returns a set of enabled LevelCurses.
  getEnabledCurseTypes(): Set<LevelCurse> {
    const enabledCurseTypes = new Set<LevelCurse>();

    if (config.enableLevelCurseBlind) {
      enabledCurseTypes.add(LevelCurse.BLIND);
    }

    if (config.enableLevelCurseDarkness) {
      enabledCurseTypes.add(LevelCurse.DARKNESS);
    }

    if (config.enableLevelCurseLabyrinth) {
      enabledCurseTypes.add(LevelCurse.LABYRINTH);
    }

    if (config.enableLevelCurseLost) {
      enabledCurseTypes.add(LevelCurse.LOST);
    }

    if (config.enableLevelCurseMaze) {
      enabledCurseTypes.add(LevelCurse.MAZE);
    }

    if (config.enableLevelCurseUnknown) {
      enabledCurseTypes.add(LevelCurse.UNKNOWN);
    }

    // If the user didn't enable any curse types in particular, enable all of them since that's the
    // game's default behavior.
    if (enabledCurseTypes.size === 0) {
      enabledCurseTypes.add(LevelCurse.BLIND);
      enabledCurseTypes.add(LevelCurse.DARKNESS);
      enabledCurseTypes.add(LevelCurse.LABYRINTH);
      enabledCurseTypes.add(LevelCurse.LOST);
      enabledCurseTypes.add(LevelCurse.MAZE);
      enabledCurseTypes.add(LevelCurse.UNKNOWN);
    }

    return enabledCurseTypes;
  }
}
