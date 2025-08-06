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
  // Cache Beyond mod character IDs for performance
  private readonly sinCharacterId = BeyondMod !== undefined ? Isaac.GetPlayerTypeByName("Sin", false) : -1;
  private readonly atonedCharacterId = BeyondMod !== undefined ? Isaac.GetPlayerTypeByName("Sin", true) : -1;
  private readonly huskCharacterId = BeyondMod !== undefined ? Isaac.GetPlayerTypeByName("The Rotten", true) : -1;

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, false)
  postGameStartedReorderedFalse(): void {
    const startTime = getTime();

    // Cache frequently accessed config values
    const enableLevelCurses = config.enableLevelCurses;
    const enableModdedCharacters = config.enableModdedCharacters;

    const player = Isaac.GetPlayer();
    const character = player.GetPlayerType();

    // If the user has disabled support for modded characters but is playing a modded character,
    // exit early.
    if (!enableModdedCharacters && isModdedCharacter(character)) {
      print(
        `${LOG_HEADER} exiting early, user has disabled support for modded characters.`,
      );
      return;
    }

    // Early exits for unsupported game modes
    if (game.IsGreedMode()) {
      print(
        `${LOG_HEADER} exiting early, this mod does not support greed mode.`,
      );
      return;
    }

    const seeds = game.GetSeeds();
    if (seeds.IsCustomRun()) {
      print(
        `${LOG_HEADER} exiting early, this mod does not support custom runs.`,
      );
      return;
    }

    const enabledRoomTypes = this.getEnabledRoomTypes();
    const enabledCurseTypes = this.getEnabledCurseTypes();

    // Handle Beyond mod custom characters.
    if (BeyondMod !== undefined) {
      // Sin replaces treasure rooms with devil rooms, so we search for those instead.
      if (character === this.sinCharacterId) {
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
      if (character === this.atonedCharacterId) {
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
      if (character === this.huskCharacterId) {
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

    // 1000 iterations seems like a good sweet spot.
    const reseedLimit = 1000;
    // These are always the adjacent room IDs.
    const adjacentRoomIndices: readonly int[] = [71, 83, 85, 97];
    const level = game.GetLevel();

    // Convert enabledRoomTypes to array for faster iteration
    const enabledRoomTypesArray = Array.from(enabledRoomTypes);

    // Pre-compute curse checking parameters for performance
    const allCurses = [LevelCurse.BLIND, LevelCurse.DARKNESS, LevelCurse.LABYRINTH, LevelCurse.LOST, LevelCurse.MAZE, LevelCurse.UNKNOWN] as const;
    const cursesToCheck = enableLevelCurses ? enabledCurseTypes : allCurses;

    // Only search a finite number of times to avoid crashing the game.
    for (let reseedIter = 0; reseedIter < reseedLimit; reseedIter++) {
      // Check for curses using pre-computed parameters
      const cursed = hasCurse(...cursesToCheck);

      // Handle curse logic first
      if (!enableLevelCurses) {
        // If curses are disabled, reseed until we have no curses
        if (cursed) {
          Isaac.ExecuteCommand("reseed");
          continue;
        }
      } else if (!noCurseTypesEnabled) {
        // If curses are enabled and specific curse types are enabled, reseed until we have a desired curse
        if (!cursed) {
          Isaac.ExecuteCommand("reseed");
          continue;
        }
      }

      // Check room types - if no room types are enabled, we're done (curse requirement met)
      if (noRoomTypesEnabled) {
        const stopTime = getTime();
        if (!enableLevelCurses) {
          print(
            `${LOG_HEADER} spawned without curses after ${reseedIter}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
          );
        } else {
          print(
            `${LOG_HEADER} spawned with an enabled curse type after ${reseedIter}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
          );
        }
        return;
      }

      // Check if we have at least one enabled room type adjacent to spawn
      let foundDesiredRoom = false;
      for (const roomGridIndex of adjacentRoomIndices) {
        const roomDescriptor = level.GetRoomByIdx(roomGridIndex);
        const roomData = roomDescriptor.Data;
        if (roomData === undefined) {
          // Not sure if it's possible to have this case.
          continue;
        }
        if (isRoomType(roomData, ...enabledRoomTypesArray)) {
          foundDesiredRoom = true;
          break;
        }
      }

      // If we found a desired room and curse requirements are met, we're done
      if (foundDesiredRoom) {
        const stopTime = getTime();
        print(
          `${LOG_HEADER} spawned adjacent to an enabled room type after ${reseedIter}/${reseedLimit} reseeds and ${stopTime - startTime} ms`,
        );
        return;
      }

      // If we didn't find desired room types, reseed and try again
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
    // If curses are disabled entirely, return empty set
    if (!config.enableLevelCurses) {
      return new Set<LevelCurse>();
    }

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

    // If the user enabled curses but didn't enable any specific curse types, enable all of them
    // since that's the game's default behavior.
    if (enabledCurseTypes.size === 0) {
      return new Set([
        LevelCurse.BLIND,
        LevelCurse.DARKNESS,
        LevelCurse.LABYRINTH,
        LevelCurse.LOST,
        LevelCurse.MAZE,
        LevelCurse.UNKNOWN,
      ]);
    }

    return enabledCurseTypes;
  }
}
