/* Quick sanity check for the build decoder. Run: bun scripts/test-decode.ts */
import { parseBuildId, buildTitle, buildSummary } from "../src/game/build-view";

const example = "A3UXzjcVkmEYGs_VKn7ESaE8d1u2YH2cERfZMzEjD_ZEse8U2oyCeMR9hu899";

const result = parseBuildId(example);

if (!result) {
    console.error("FAILED to decode example build!");
    process.exit(1);
}

console.log("title:", buildTitle(result.view));
console.log("---");
console.log(buildSummary(result.view));
console.log("---");
console.log("invalid:", result.view.invalid, "| upgraded:", result.view.upgraded, "| version:", result.view.version);
console.log("weapon parts:", result.view.weapon?.parts.map(p => `${p.label}: ${p.part?.name ?? "-"}`));
console.log("game version:", result.view.gameVersion);
