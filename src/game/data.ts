import namesJson from "./names.json";
import dataJson from "./data.json";

import type { GameData, NamesMap, NamesMapType } from "./types";

export const gameData = dataJson as unknown as GameData;
export const namesMap = namesJson as unknown as NamesMap;

export { NamesMapType };
