import * as fs from "fs";
import { tryDeserialize } from "../src/game/build-view";
import { gameData } from "../src/game/data";
import { findPerkByName } from "../src/game/build-model";

interface RawMetaCategory {
    name: string;
    description: string;
    builds: {
        buildId: string;
        title: string;
        vsElement: string | null;
        subcategory: string | null;
    }[];
}

interface IndexedMetaBuild {
    buildId: string;
    title: string;
    category: string;
    vsElement: string | null;
    subcategory: string | null;
    weaponType: string;
    weaponName: string;
    weaponIcon: string;
    weaponElement: string | null;
    bondName: string | null;
    bondIcon: string | null;
    omnicellName: string | null;
    omnicellIcon: string | null;
    lanternName: string | null;
    lanternIcon: string | null;
    head: { name: string; icon: string } | null;
    torso: { name: string; icon: string } | null;
    arms: { name: string; icon: string } | null;
    legs: { name: string; icon: string } | null;
    perks: { name: string; value: number }[];
    cells: { slot: string; cellName: string }[];
}

const rawCategories: RawMetaCategory[] = JSON.parse(
    fs.readFileSync("./src/game/meta-builds.json", "utf8")
);

const indexedBuilds: IndexedMetaBuild[] = [];
let successCount = 0;
let failCount = 0;

for (const cat of rawCategories) {
    for (const b of cat.builds) {
        const model = tryDeserialize(b.buildId);
        if (!model || !model.weapon) {
            failCount++;
            continue;
        }

        const weapon = model.weapon;
        const bond = model.bondWeaponData;
        const omnicell = model.omnicell ? gameData.omnicells[model.omnicell] : null;
        const lantern = model.lanternData;
        const head = model.head;
        const torso = model.torso;
        const arms = model.arms;
        const legs = model.legs;

        // Calculate perks
        const perkMap = new Map<string, number>();
        const addPerks = (perkList?: { name: string; value: number; powerSurged?: boolean }[]) => {
            for (const p of perkList ?? []) {
                perkMap.set(p.name, (perkMap.get(p.name) ?? 0) + (p.powerSurged ? 3 : p.value));
            }
        };

        addPerks(weapon.perks);
        addPerks(head?.perks);
        addPerks(torso?.perks);
        addPerks(arms?.perks);
        addPerks(legs?.perks);

        // Add cells perks
        const cellVariants = [
            model.weaponCell1,
            model.weaponCell2,
            model.headCell,
            model.torsoCell,
            model.armsCell,
            model.legsCell,
            model.lanternCell,
        ];

        const cells: { slot: string; cellName: string }[] = [];

        for (const variant of cellVariants) {
            if (!variant) continue;
            const cell = Object.values(gameData.cells).find(c => c.variants && variant in c.variants);
            if (cell && cell.variants[variant]) {
                cells.push({ slot: cell.slot, cellName: cell.name });
                for (const [pName, val] of Object.entries(cell.variants[variant].perks)) {
                    perkMap.set(pName, (perkMap.get(pName) ?? 0) + val);
                }
            }
        }

        const perks = Array.from(perkMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

        indexedBuilds.push({
            buildId: b.buildId,
            title: b.title || weapon.name,
            category: cat.name,
            vsElement: b.vsElement,
            subcategory: b.subcategory,
            weaponType: weapon.type,
            weaponName: weapon.name,
            weaponIcon: weapon.icon,
            weaponElement: weapon.elemental,
            bondName: bond?.name ?? null,
            bondIcon: bond?.icon ?? null,
            omnicellName: omnicell?.name ?? null,
            omnicellIcon: omnicell?.icon ?? null,
            lanternName: lantern?.name ?? null,
            lanternIcon: lantern?.icon ?? null,
            head: head ? { name: head.name, icon: head.icon } : null,
            torso: torso ? { name: torso.name, icon: torso.icon } : null,
            arms: arms ? { name: arms.name, icon: arms.icon } : null,
            legs: legs ? { name: legs.name, icon: legs.icon } : null,
            perks,
            cells,
        });

        successCount++;
    }
}

console.log(`Successfully indexed ${successCount} builds (${failCount} failed)`);

const outputData = {
    categories: rawCategories.map(c => ({ name: c.name, description: c.description })),
    builds: indexedBuilds,
};

fs.writeFileSync("./src/game/meta-builds-indexed.json", JSON.stringify(outputData, null, 2));
console.log("Saved to ./src/game/meta-builds-indexed.json");
