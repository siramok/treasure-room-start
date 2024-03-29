import { ISCFeature, upgradeMod } from "isaacscript-common";
import { MOD_NAME } from "./constants";

const FEATURES = [
  ISCFeature.MODDED_ELEMENT_SETS,
  ISCFeature.SAVE_DATA_MANAGER,
] as const;

const modVanilla = RegisterMod(MOD_NAME, 1);
export const mod = upgradeMod(modVanilla, FEATURES);
