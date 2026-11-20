"use client";

/**
 * Full-screen game-style inventory overlay used to pick weapons, armour,
 * lanterns, omnicells, cells, parts and consumables. Big icon grid grouped by
 * category with search, an optional facet filter rail, and keyboard
 * navigation (arrows / Enter / Escape).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { ConsumableGlyph, DiamondPip, ItemIcon } from "./decor";

export interface PickerItem {
    value: string;
    label: string;
    icon: string | null;
    group: string;
    hint?: string;
    meta?: string;
    description?: string;
    consumableType?: "flask" | "tonic" | "pylon";
}

export interface ItemPickerProps {
    title: string;
    items: PickerItem[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    onClose: () => void;
    allowClear?: boolean;
    filterLabel?: string;
    filterValues?: string[];
    filterOf?: (item: PickerItem) => string;
}

const NORMALIZE = (text: string): string => text.toLowerCase();

export const ItemPickerOverlay = ({
    title,
    items,
    selectedValue,
    onSelect,
    onClose,
    allowClear = true,
    filterLabel,
    filterValues,
    filterOf,
}: ItemPickerProps) => {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<string | null>(null);
    const [navIndex, setNavIndex] = useState<number | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        const needle = NORMALIZE(query.trim());
        return items.filter(item => {
            if (filter && filterOf && filterOf(item) !== filter) {
                return false;
            }
            if (needle === "") {
                return true;
            }
            return (
                NORMALIZE(item.label).includes(needle) ||
                NORMALIZE(item.group).includes(needle) ||
                (item.hint ? NORMALIZE(item.hint).includes(needle) : false)
            );
        });
    }, [items, query, filter, filterOf]);

    const grouped = useMemo(() => {
        const map = new Map<string, PickerItem[]>();
        for (const item of filtered) {
            const list = map.get(item.group) ?? [];
            list.push(item);
            map.set(item.group, list);
        }
        return [...map.entries()];
    }, [filtered]);

    const flat = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

    /* Derived active index: user navigation wins, otherwise the selected item. */
    const selectedIndex = useMemo(
        () => flat.findIndex(item => item.value === selectedValue),
        [flat, selectedValue],
    );
    const activeIndex = navIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const node = gridRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
        node?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const commit = (value: string | null) => {
        onSelect(value);
        onClose();
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            setNavIndex(index => Math.min(flat.length - 1, (index ?? activeIndex) + 1));
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            setNavIndex(index => Math.max(0, (index ?? activeIndex) - 1));
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setNavIndex(index => Math.min(flat.length - 1, (index ?? activeIndex) + 3));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setNavIndex(index => Math.max(0, (index ?? activeIndex) - 3));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const item = flat[activeIndex];
            if (item) {
                commit(item.value);
            }
        }
    };

    let runningIndex = -1;

    return (
        <div
            className="lo-picker-backdrop lo-overlay-in absolute inset-0 z-40 flex flex-col outline-none"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} picker`}
            onKeyDown={onKeyDown}
            tabIndex={-1}
        >
            {/* header */}
            <div className="flex items-center gap-6 border-b border-[#3a3f47] bg-[rgba(10,12,16,0.92)] px-[56px] py-[18px]">
                <span className="flex items-center gap-3">
                    <DiamondPip size={8} color="#bfae85" />
                    <span className="lo-serif text-[26px] font-semibold tracking-[0.16em] text-[#dcd8cc]">
                        {title.toUpperCase()}
                    </span>
                </span>
                <div className="relative ml-auto w-[420px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c828c]" aria-hidden />
                    <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={event => {
                            setQuery(event.target.value);
                            setNavIndex(null);
                        }}
                        placeholder={`Search ${title.toLowerCase()}…`}
                        aria-label={`Search ${title}`}
                        className="lo-card h-[42px] w-full rounded-[4px] pl-10 pr-4 text-[15px] text-[#e8e4da] placeholder:text-[#7c828c] focus:outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e]"
                    />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close picker (Escape)"
                    className="lo-card flex h-[42px] w-[42px] items-center justify-center text-[#9a9a94] transition-colors hover:text-[#e0a33e]"
                >
                    <X className="h-5 w-5" aria-hidden />
                </button>
            </div>

            {/* body */}
            <div className="flex min-h-0 flex-1">
                {/* filter rail */}
                {filterValues && filterValues.length > 0 && (
                    <nav className="flex w-[200px] shrink-0 flex-col gap-[6px] overflow-y-auto border-r border-[#3a3f47] bg-[rgba(8,10,13,0.85)] p-[16px]" aria-label={filterLabel}>
                        <span className="lo-sublabel mb-1">{(filterLabel ?? "Filter").toUpperCase()}</span>
                        <button
                            type="button"
                            onClick={() => setFilter(null)}
                            aria-pressed={filter === null}
                            className={`lo-perk-row px-[12px] py-[8px] text-left text-[13.5px] font-semibold tracking-[0.04em] ${
                                filter === null ? "!border-[#e0a33e] text-[#e0a33e]" : "text-[#b9bcc2]"
                            }`}
                        >
                            All
                        </button>
                        {filterValues.map(value => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(current => (current === value ? null : value))}
                                aria-pressed={filter === value}
                                className={`lo-perk-row flex items-center gap-2 px-[12px] py-[8px] text-left text-[13.5px] font-semibold tracking-[0.04em] ${
                                    filter === value ? "!border-[#e0a33e] text-[#e0a33e]" : "text-[#b9bcc2]"
                                }`}
                            >
                                <ItemIcon icon={`/assets/icons/elements/${value}.png`} alt="" size={17} />
                                {value}
                            </button>
                        ))}
                    </nav>
                )}

                {/* grid */}
                <div ref={gridRef} className="min-h-0 flex-1 overflow-y-auto p-[28px]">
                    {flat.length === 0 && (
                        <p className="pt-16 text-center text-[15px] text-[#84888f]">Nothing matches your search.</p>
                    )}
                    {grouped.map(([group, list]) => (
                        <section key={group} className="mb-[26px]">
                            <div className="mb-[12px] flex items-center gap-3">
                                <span className="lo-serif text-[16px] font-semibold tracking-[0.14em] text-[#c8cbcf]">
                                    {group.toUpperCase()}
                                </span>
                                <span className="lo-flourish" aria-hidden />
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(158px,1fr))] gap-[12px]">
                                {list.map(item => {
                                    runningIndex += 1;
                                    const index = runningIndex;
                                    const isSelected = item.value === selectedValue;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            data-index={index}
                                            data-active={index === activeIndex}
                                            onClick={() => commit(item.value)}
                                            onMouseEnter={() => setNavIndex(index)}
                                            aria-label={`${item.label}${item.hint ? ` - ${item.hint}` : ""}`}
                                            aria-pressed={isSelected}
                                            className={`lo-picker-card flex h-[178px] flex-col items-center justify-between p-[12px] text-center ${
                                                isSelected ? "!border-[#e0a33e] shadow-[0_0_12px_rgba(224,163,62,0.4)]" : ""
                                            }`}
                                        >
                                            <span className="flex w-full justify-start">
                                                <span className="lo-level-chip !text-[12px]">{item.meta ?? ""}</span>
                                            </span>
                                            {item.icon ? (
                                                <ItemIcon icon={item.icon} alt={item.label} size={78} />
                                            ) : item.consumableType ? (
                                                <ConsumableGlyph type={item.consumableType} size={72} />
                                            ) : (
                                                <ItemIcon icon={item.icon} alt={item.label} size={78} />
                                            )}
                                            <span className="flex w-full flex-col gap-[2px]">
                                                <span className="truncate text-[13.5px] font-semibold text-[#e8e4da]" title={item.label}>
                                                    {item.label}
                                                </span>
                                                {item.hint && (
                                                    <span className="truncate text-[11.5px] text-[#9a9a94]" title={item.hint}>
                                                        {item.hint}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-[#3a3f47] bg-[rgba(10,12,16,0.92)] px-[56px] py-[12px]">
                <span className="text-[12.5px] tracking-[0.06em] text-[#84888f]">
                    ARROWS to navigate · ENTER to equip · ESC to close
                </span>
                {allowClear && (
                    <button
                        type="button"
                        onClick={() => commit(null)}
                        className="lo-button-text !text-[15px] tracking-[0.16em]"
                    >
                        CLEAR SLOT
                    </button>
                )}
            </div>
        </div>
    );
};
