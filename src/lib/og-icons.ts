import fs from "fs";
import path from "path";

/**
 * Asset loaders for the Open Graph image route.
 *
 * Icons come from public/assets/icons, fonts from public/fonts (with a
 * src/assets fallback for dev). When the file system copy is unavailable
 * (e.g. serverless), assets are fetched from the deployed site instead.
 */

const iconCache = new Map<string, string>();

export const loadIconDataUrl = async (iconPath: string | null | undefined): Promise<string | null> => {
    if (!iconPath || !iconPath.startsWith("/assets/")) {
        return null;
    }

    if (iconCache.has(iconPath)) {
        return iconCache.get(iconPath) ?? null;
    }

    const result = await readBinary(`public${iconPath}`, iconPath);
    if (result !== null) {
        iconCache.set(iconPath, result);
    }
    return result;
};

const fontCache = new Map<string, Buffer>();

export const loadFont = async (fileName: string): Promise<Buffer> => {
    if (fontCache.has(fileName)) {
        return fontCache.get(fileName)!;
    }

    const candidates = [
        path.join(process.cwd(), "src", "assets", "fonts", fileName),
        path.join(process.cwd(), "public", "fonts", fileName),
    ];

    for (const candidate of candidates) {
        try {
            const data = fs.readFileSync(candidate);
            fontCache.set(fileName, data);
            return data;
        } catch {
            // try next candidate
        }
    }

    const { getSiteUrl } = await import("./site");
    const response = await fetch(`${getSiteUrl()}/fonts/${fileName}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
        throw new Error(`Font ${fileName} unavailable`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    fontCache.set(fileName, data);
    return data;
};

const readBinary = async (relativePath: string, urlPath: string): Promise<string | null> => {
    try {
        const data = fs.readFileSync(path.join(process.cwd(), relativePath));
        return `data:image/png;base64,${data.toString("base64")}`;
    } catch {
        // fall through to fetch
    }

    try {
        const { getSiteUrl } = await import("./site");
        const url = `${getSiteUrl()}${encodeURI(urlPath)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
            return null;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:image/png;base64,${buffer.toString("base64")}`;
    } catch {
        return null;
    }
};
