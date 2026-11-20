export const getClientFingerprint = (): string => {
    if (typeof window === "undefined") return "";
    try {
        let canvasHash = "";
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 160;
            canvas.height = 30;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.textBaseline = "top";
                ctx.font = "14px 'Arial'";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#f60";
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = "#069";
                ctx.fillText("Dauntless Builder \uD83D\uDD25", 2, 15);
                ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                ctx.fillText("Dauntless Builder \uD83D\uDD25", 4, 17);
                canvasHash = canvas.toDataURL();
            }
        } catch {
            // ignore canvas errors
        }

        const parts = [
            navigator.userAgent,
            navigator.language,
            window.screen.width,
            window.screen.height,
            window.screen.colorDepth,
            navigator.hardwareConcurrency || 1,
            Intl.DateTimeFormat().resolvedOptions().timeZone || "",
            canvasHash.slice(-50),
        ];

        let hash = 0;
        const str = parts.join("###");
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return `cf_${Math.abs(hash).toString(36)}`;
    } catch {
        return "cf_fallback";
    }
};

export const getClientId = (): string => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("dauntless_client_id");
    if (!id) {
        id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `usr_${Math.random().toString(36).substring(2)}_${Date.now()}`;
        try {
            localStorage.setItem("dauntless_client_id", id);
        } catch {
            // ignore
        }
    }
    return id;
};
