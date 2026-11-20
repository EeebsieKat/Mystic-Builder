/**
 * Menu / shell asset registry.
 *
 * Every screen outside the loadout stage (main menu, database shell) is
 * rendered by the menu-ui kit and pulls its art from this single file.
 * Anything set to `null` falls back to the built-in CSS styling, so the
 * site works out of the box and real game assets can be dropped in later
 * without touching any component code.
 *
 * How to add real assets:
 *   1. Drop files into `public/assets/menu/…` (or anywhere under `public/`).
 *   2. Point the matching entry below at the public path, e.g.
 *        background: "/assets/menu/bg-ramsgate.png"
 *   3. For nine-sliced buttons provide one texture per state; the slice /
 *      border widths control how the texture is cut and rendered:
 *        slice: how many pixels of the source image form the border,
 *        width: how thick the rendered border is on screen (CSS px).
 */

/** Everything the menu-ui kit needs. All keys optional / nullable. */
export interface MenuAssets {
    /** Full-screen background art (rendered cover, dimmed for readability). */
    background: string | null;

    /** Logo shown in the menu brand block (falls back to the Awakening icon). */
    logo: string | null;

    /**
     * Nine-sliced button textures per interaction state. Provide all three
     * or none - the kit never mixes texture and CSS states.
     */
    buttonTextures: {
        normal: string | null;
        hover: string | null;
        active: string | null;
        /** Source pixels cut off each corner of the texture. */
        slice: number;
        /** Rendered border thickness in CSS px. */
        width: number;
    };

    /**
     * Nine-sliced panel texture for menu cards / plaques.
     * Same slicing rules as the button textures.
     */
    panelTexture: {
        src: string | null;
        slice: number;
        width: number;
    };

    /** Menu sound effects (short UI wavs). Null = silent. */
    sounds: {
        hover: string | null;
        click: string | null;
    };
}

export const MENU_ASSETS: MenuAssets = {
    background: "/assets/awakening-ui/bg/RadiantBackground.png",
    logo: null,

    buttonTextures: {
        normal: "/assets/awakening-ui/generic/Button1Normal.png",
        hover: "/assets/awakening-ui/generic/Button1Hover.png",
        active: "/assets/awakening-ui/generic/Button1Normal.png",
        slice: 40,
        width: 20,
    },

    panelTexture: {
        src: null,
        slice: 16,
        width: 16,
    },

    sounds: {
        hover: "/assets/awakening-ui//sounds/ButtonHoverGeneric.wav",
        click: "/assets/awakening-ui/sounds/loadout/30_UI-slide-panel-close.wav",
    },
};
