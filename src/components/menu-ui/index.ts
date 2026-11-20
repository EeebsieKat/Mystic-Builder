/**
 * Mystic Builder shell kit - the menu/infrastructure UI system.
 *
 * Everything the non-gameplay screens are built from: the asset registry
 * (src/lib/menu-assets.ts), nine-slice containers, game menu buttons with
 * sound feedback, full-viewport backdrops and the site info block.
 */

export { NineSlice, type NineSliceProps } from "./nine-slice";
export { MenuButton, type MenuButtonProps } from "./menu-button";
export { MenuBackdrop } from "./menu-backdrop";
export { useMenuSound } from "./use-menu-sound";
export { SiteInfoFull, SiteInfoCompact, VersionLabel, VERSION_LABEL } from "./site-info";
