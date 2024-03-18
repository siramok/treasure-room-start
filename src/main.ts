import { initModFeatures } from "isaacscript-common";
import { StartNewRun } from "./classes/features/StartNewRun";
import { MOD_NAME, MOD_VERSION } from "./constants";
import { mod } from "./mod";
import { initModConfigMenu } from "./modConfigMenu";

const MOD_FEATURES = [StartNewRun] as const;

export function main(): void {
  initModFeatures(mod, MOD_FEATURES);
  initModConfigMenu();
  print(`${MOD_NAME} v${MOD_VERSION} loaded.`);
}
