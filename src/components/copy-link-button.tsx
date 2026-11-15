"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const CopyLinkButton = ({ path }: { path: string }) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        const url = `${window.location.origin}${path}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast({ title: "Link copied", description: url });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Could not copy", description: url, variant: "destructive" });
        }
    };

    return (
        <Button variant="outline" onClick={copy} className="min-w-44">
            {copied ? <Check className="mr-2 h-4 w-4" aria-hidden /> : <Copy className="mr-2 h-4 w-4" aria-hidden />}
            {copied ? "Copied" : "Copy build link"}
        </Button>
    );
};
