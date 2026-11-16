"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SelectOption {
    value: string;
    label: string;
    icon?: string | null;
    group?: string;
    hint?: string;
}

interface ItemSelectProps {
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    emptyLabel?: string;
    clearable?: boolean;
    ariaLabel?: string;
    className?: string;
}

/** Searchable combobox used for every item picker in the editor. */
const ItemSelect = ({
    options,
    value,
    onChange,
    placeholder = "Search…",
    emptyLabel = "Nothing found.",
    clearable = true,
    ariaLabel,
    className,
}: ItemSelectProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = useMemo(
        () => options.find(option => option.value === value) ?? null,
        [options, value],
    );

    const groups = useMemo(() => {
        const map = new Map<string, SelectOption[]>();
        for (const option of options) {
            const key = option.group ?? "";
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(option);
        }
        return [...map.entries()];
    }, [options]);

    const showClear = clearable && value !== null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label={ariaLabel}
                    className={cn(
                        "h-auto min-h-11 w-full justify-between gap-2 px-3 py-1.5 text-left font-normal",
                        !selected && "text-muted-foreground",
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {selected?.icon ? (
                            <Image
                                src={selected.icon}
                                alt=""
                                width={26}
                                height={26}
                                className="icon-glow h-auto w-auto shrink-0 object-contain"
                            />
                        ) : null}
                        <span className="truncate">{selected ? selected.label : placeholder}</span>
                        {selected?.hint ? (
                            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                {selected.hint}
                            </span>
                        ) : null}
                    </span>
                    {showClear ? (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear selection"
                            className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={event => {
                                event.stopPropagation();
                                onChange(null);
                            }}
                            onKeyDown={event => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.stopPropagation();
                                    onChange(null);
                                }
                            }}
                        >
                            ✕
                        </span>
                    ) : (
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] rounded-xl border-primary/25 bg-popover/95 p-0 shadow-[0_16px_48px_-12px_oklch(0_0_0/0.7),0_0_0_1px_oklch(0.82_0.135_85/0.1)] backdrop-blur-md"
                align="start"
            >
                <Command shouldFilter={true}>
                    <div className="flex items-center gap-2 border-b px-3">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder={placeholder}
                            className="h-10 border-0 focus:ring-0"
                        />
                    </div>
                    <CommandList className="max-h-72">
                        <CommandEmpty>{emptyLabel}</CommandEmpty>
                        {groups.map(([group, groupOptions]) => (
                            <CommandGroup
                                key={group || "items"}
                                heading={group || undefined}
                                value={group || "items"}
                            >
                                {groupOptions.map(option => (
                                    <CommandItem
                                        key={option.value}
                                        value={`${option.label} ${option.hint ?? ""} ${option.value}`}
                                        onSelect={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className="gap-2"
                                    >
                                        {option.icon ? (
                                            <Image
                                                src={option.icon}
                                                alt=""
                                                width={26}
                                                height={26}
                                                className="h-auto w-auto shrink-0 object-contain transition-[filter] data-[selected=true]:icon-glow"
                                            />
                                        ) : null}
                                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                        {option.hint ? (
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {option.hint}
                                            </span>
                                        ) : null}
                                        <Check
                                            className={cn(
                                                "h-4 w-4 shrink-0 text-primary drop-shadow-[0_0_6px_oklch(0.82_0.135_85/0.5)]",
                                                option.value === value ? "opacity-100" : "opacity-0",
                                            )}
                                            aria-hidden
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default ItemSelect;
