"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export const ViewCounter = ({ buildId }: { buildId: string }) => {
    const [views, setViews] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const track = async () => {
            try {
                const response = await fetch(`/api/builds/${encodeURIComponent(buildId)}/views`, {
                    method: "POST",
                });
                if (!response.ok) {
                    return;
                }
                const data = (await response.json()) as { views?: number };
                if (!cancelled && typeof data.views === "number") {
                    setViews(data.views);
                }
            } catch {
                // stats are optional, silently ignore
            }
        };

        void track();

        return () => {
            cancelled = true;
        };
    }, [buildId]);

    if (views === null) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {views} {views === 1 ? "view" : "views"}
        </span>
    );
};
