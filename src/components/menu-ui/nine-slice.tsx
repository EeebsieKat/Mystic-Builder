"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Nine-slice container.
 *
 * When `src` is provided the div's border is drawn from a 9-sliced texture
 * (CSS border-image), keeping corners crisp at any size - the standard
 * trick for game UI buttons/panels. Without `src` it renders a plain div
 * so callers can style it with the built-in CSS look.
 */

export interface NineSliceProps {
    /** Texture in public/… (required together with slice/width). */
    src?: string | null;
    /** Source-image pixels that form the border (corner cut). */
    slice?: number;
    /** Rendered border thickness in CSS px. */
    width?: number;
    /** Draw the centre of the texture inside the border (panel look). */
    fill?: boolean;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    /** Rendered element (defaults to div). */
    as?: "div" | "button" | "li";
}

export const NineSlice = ({
    src,
    slice = 12,
    width = 12,
    fill = true,
    className,
    style,
    children,
    as = "div",
}: NineSliceProps) => {
    const Tag = as as "div";

    if (!src) {
        return (
            <Tag className={className} style={style}>
                {children}
            </Tag>
        );
    }

    const borderStyle: CSSProperties = {
        borderStyle: "solid",
        borderWidth: width,
        borderImageSource: `url(${src})`,
        borderImageSlice: `${slice}${fill ? " fill" : ""}`,
        borderImageWidth: `${width}px`,
        borderImageRepeat: "stretch",
        ...style,
    };

    return (
        <Tag className={cn("bg-transparent", className)} style={borderStyle}>
            {children}
        </Tag>
    );
};
