"use client";

import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Compass,
    Database,
    ExternalLink,
    Hammer,
    Heart,
    Layers,
    Lightbulb,
    Share2,
    Shield,
    Sparkles,
    Swords,
    Zap,
} from "lucide-react";

import { Footer } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const WEAPON_CLASSES = [
    { id: "Sword", name: "Sword", icon: "/assets/icons/generic/Sword.png", role: "Balanced DPS & Overdrive" },
    { id: "Axe", name: "Axe", icon: "/assets/icons/generic/Axe.png", role: "Charged Cleaves & Resolve" },
    { id: "Hammer", name: "Hammer", icon: "/assets/icons/generic/Hammer.png", role: "Stagger Crushes & Aethercharge" },
    { id: "Chain Blades", name: "Chain Blades", icon: "/assets/icons/generic/ChainBlades.png", role: "High Mobility & Reapers" },
    { id: "War Pike", name: "War Pike", icon: "/assets/icons/generic/WarPike.png", role: "Wound Piercing & Missiles" },
    { id: "Repeaters", name: "Repeaters", icon: "/assets/icons/generic/Repeater.png", role: "Modular Ranged Firepower" },
    { id: "Aether Strikers", name: "Aether Strikers", icon: "/assets/icons/generic/AetherStrikers.png", role: "Rapid Mantras & Surges" },
];

const OMNICELLS = [
    {
        name: "Discipline",
        icon: "/assets/icons/omnicells/Discipline.png",
        tagline: "Flawless Parries & Critical Surges",
        color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
        pillColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        description: "Limits healing in exchange for flaming parry counter-attacks and lethal critical strike stacking.",
    },
    {
        name: "Revenant",
        icon: "/assets/icons/omnicells/Revenant.png",
        tagline: "Void Health Sacrifice & Colossal Burst",
        color: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
        pillColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        description: "Channels void tendrils that drain Slayer HP into devastating long-range dark aether explosions.",
    },
    {
        name: "Tempest",
        icon: "/assets/icons/omnicells/Tempest.png",
        tagline: "Velocity Scaling & Shock Annihilation",
        color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
        pillColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        description: "Converts sprint velocity and dodge momentum into lightning chain charges for massive single-target strikes.",
    },
    {
        name: "Bastion",
        icon: "/assets/icons/omnicells/Bastion.png",
        tagline: "Fortified Shields & Crushing Impact",
        color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
        pillColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        description: "Amplifies shield generation and expels stacked shielding into a devastating area-of-effect ground slam.",
    },
    {
        name: "Artificer",
        icon: "/assets/icons/omnicells/Artificer.png",
        tagline: "Drone Support, Cleansing & Instant Revives",
        color: "from-teal-500/20 to-cyan-500/10 border-teal-500/30",
        pillColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        description: "Deploys an automated companion drone to heal teammates, laser vulnerable behemoth parts, and revive fallen Slayers.",
    },
    {
        name: "Iceborne",
        icon: "/assets/icons/omnicells/Iceborne.png",
        tagline: "Unstoppable Glacial Fortitude",
        color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
        pillColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        description: "Grants continuous lifesteal, massive damage mitigation, and an icy lance that grants temporary invulnerability.",
    },
];

const ELEMENTS = [
    { name: "Blaze", color: "#E25822", icon: "/assets/icons/elements/Blaze.png", vs: "Frost" },
    { name: "Frost", color: "#6EC6E8", icon: "/assets/icons/elements/Frost.png", vs: "Blaze" },
    { name: "Shock", color: "#F3C13A", icon: "/assets/icons/elements/Shock.png", vs: "Terra" },
    { name: "Terra", color: "#6FBF4B", icon: "/assets/icons/elements/Terra.png", vs: "Shock" },
    { name: "Radiant", color: "#EFD97F", icon: "/assets/icons/elements/Radiant.png", vs: "Umbral" },
    { name: "Umbral", color: "#8A5FE8", icon: "/assets/icons/elements/Umbral.png", vs: "Radiant" },
];

const LOGO_ASCII = `                   /\\    /\\                   
                  /8\\    /8\\                  
                 /88\\    /O8\\                 
                /8O8\\    /8O8\\                
               /#88\\      /OO8\\               
              /#88#\\      /8OO8\\              
             /#88#\\        /8OO8\\             
           /8#88#\\    ◈     /8888O\\           
          /8888#\\            /88888\\          
        /888888\\              /88888O\\        
       /8OOO88\\                /888O88\\       
       /O88OOO88\\            /8OOOO8OO\\       
     /    /88OOO8\\          /8OOOOO\\    \\     
    /88O\\   /88OO8\\        /OOOOO\\   /O88\\    
   /8oOO88\\   /8OO8\\      /OoOO\\   /O888O8\\   
  /OoOOOOO8O\\   /8O\\      /oO\\   /O888888OO\\  
/OOOOOooOOO8#\\   /88\\    /OO\\   /88OOooooOOOO\\
/8o\\       /o8\\   /8\\    /O\\   /Oo\\       /oO\\
 /8O\\              /\\    /\\              /OO\\ 
  /88\\                                  /8O\\  `;

export default function LandingPage() {
    return (
        <div className="relative flex w-full flex-col overflow-hidden bg-[var(--bg)] text-foreground">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,163,255,0.12)_0%,rgba(224,194,135,0.06)_45%,transparent_70%)] blur-3xl" />

            {/* HERO SECTION - Full First Viewport */}
            <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-center px-6 pt-16 pb-16 lg:px-12 lg:pt-20 lg:pb-20">
                {/* Golden Wing Crest Backdrop */}
                <div className="pointer-events-none absolute top-1/2 right-0 -z-10 flex -translate-y-1/2 items-center justify-center opacity-25 select-none">
                    <img
                        src="/assets/awakening-ui/loadout/GildWingsGold.png"
                        alt=""
                        className="h-auto w-[650px] max-w-none md:w-[850px] lg:w-[950px]"
                        aria-hidden="true"
                    />
                </div>

                <div className="mx-auto w-full max-w-6xl">
                    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
                        {/* Left Column: Headlines & Actions */}
                        <div className="flex flex-col items-start text-left lg:col-span-7">
                            {/* Main Headline */}
                            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-[52px] leading-tight">
                                Forge Your Ultimate <span className="text-gold-gradient">Slayer Loadout</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                                The premier build calculator and meta armory for Dauntless 1.14.7. Plan gear, cell thresholds, and share builds instantly.
                            </p>

                            {/* Action Buttons (2 buttons only) */}
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-xl bg-gradient-to-r from-[var(--aether)] to-[#38bdf8] px-8 text-sm font-bold text-black shadow-[0_0_25px_rgba(91,163,255,0.4)] transition-all hover:scale-105 hover:from-[#7cb8ff] hover:to-[#56caff] hover:shadow-[0_0_35px_rgba(91,163,255,0.6)] cursor-pointer"
                                >
                                    <Link href="/?tab=builder" className="inline-flex items-center gap-2">
                                        <Hammer className="h-4 w-4" />
                                        <span>Launch Build Planner</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="h-12 rounded-xl border-[var(--gold)]/40 bg-[var(--bg-raise)]/80 px-7 text-sm font-semibold text-[var(--gold)] backdrop-blur-md transition-all hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold-bright)] cursor-pointer"
                                >
                                    <Link href="/?tab=suggestions" className="inline-flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" />
                                        <span>Explore</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: ASCII Mystic Crest */}
                        <div className="relative flex items-center justify-center lg:col-span-5 select-none">
                            <div className="relative flex items-center justify-center">
                                {/* Ambient Glow behind Crest */}
                                <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,163,255,0.22)_0%,rgba(224,194,135,0.14)_50%,transparent_70%)] blur-2xl animate-pulse" />
                                <div className="absolute h-84 w-84 rounded-full border border-[var(--gold)]/15 opacity-40 animate-[spin_60s_linear_infinite]" />
                                <div className="absolute h-72 w-72 rounded-full border border-dashed border-[var(--aether-line)]/30 opacity-30 animate-[spin_40s_linear_infinite_reverse]" />

                                <pre
                                    aria-label="Mystic Paradox Crest ASCII Art"
                                    className="relative font-mono text-[8px] xs:text-[9.5px] sm:text-[11px] md:text-[12px] lg:text-[12.5px] xl:text-[14px] leading-[1.12] font-black text-transparent bg-clip-text bg-gradient-to-b from-[var(--gold-bright)] via-[var(--gold)] to-[var(--aether)] drop-shadow-[0_0_30px_rgba(224,194,135,0.5)] transition-transform duration-500 hover:scale-105"
                                >
                                    {LOGO_ASCII}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="gold-rule mx-auto max-w-6xl w-full" aria-hidden="true" />

            {/* THREE CORE PILLARS / BENTO SHOWCASE */}
            <section className="relative px-6 py-14 lg:px-12 lg:py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-start text-left max-w-2xl">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--gold)]/80">
                            Core Capabilities
                        </p>
                        <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Everything You Need to Master the Hunt
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-2)] sm:text-sm">
                            Built from official 1.14.7 game extracts with authentic visual assets, calculation engines, and instant URL sharing.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {/* 1. Awakening Loadout Planner */}
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--line-2)] bg-[var(--bg-raise)]/90 p-5 shadow-md transition-all duration-300 hover:border-[var(--aether-line)] hover:shadow-[0_0_25px_rgba(91,163,255,0.12)]">
                            <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[var(--aether)]/10 blur-xl transition-all group-hover:bg-[var(--aether)]/20" />
                            <div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--aether-line)] bg-[var(--aether-a10)] text-[var(--aether-hi)]">
                                    <Hammer className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3.5 font-display text-base font-bold text-white">
                                    Awakening Loadout Planner
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-2)]">
                                    Equip weapons, armor, lanterns, and omnicells with live Power Surge scaling and cell threshold validation.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[var(--line)]">
                                <Link
                                    href="/?tab=builder"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--aether-hi)] transition-colors hover:text-white"
                                >
                                    <span>Open Build Planner</span>
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>

                        {/* 2. 517 Meta Builds Index */}
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--line-2)] bg-[var(--bg-raise)]/90 p-5 shadow-md transition-all duration-300 hover:border-[var(--gold)]/40 hover:shadow-[0_0_25px_rgba(224,194,135,0.12)]">
                            <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[var(--gold)]/10 blur-xl transition-all group-hover:bg-[var(--gold)]/20" />
                            <div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
                                    <Lightbulb className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3.5 font-display text-base font-bold text-white">
                                    517 Meta Guides Index
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-2)]">
                                    Explore curated community meta builds from the Reforged index. Filter by weapon, perks, or elemental matchup.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[var(--line)]">
                                <Link
                                    href="/?tab=suggestions"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--gold)] transition-colors hover:text-[var(--gold-bright)]"
                                >
                                    <span>Browse Meta Builds</span>
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>

                        {/* 3. 1.14.7 Armory Database */}
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--line-2)] bg-[var(--bg-raise)]/90 p-5 shadow-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.12)]">
                            <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-cyan-500/10 blur-xl transition-all group-hover:bg-cyan-500/20" />
                            <div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                                    <Database className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3.5 font-display text-base font-bold text-white">
                                    Complete Item Armory
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-2)]">
                                    Search every weapon, armour piece, cell, and unique passive effect extracted from Dauntless 1.14.7.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[var(--line)]">
                                <Link
                                    href="/?tab=database"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 transition-colors hover:text-cyan-200"
                                >
                                    <span>Explore Armory</span>
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* OMNICELL ARCHETYPES SHOWCASE */}
            <section className="relative border-y border-[var(--line)] bg-[var(--bg-raise)]/40 px-6 py-16 lg:px-12 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--aether-line)] bg-[var(--aether-a10)] px-3.5 py-1 text-xs font-semibold text-[var(--aether-hi)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Combat Specialization</span>
                        </div>
                        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Six Distinct Omnicell Playstyles
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                            Tailor your loadout around unique combat mechanics: parrying, void damage bursts, high velocity shock attacks, or unbreakable shields.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {OMNICELLS.map(omni => (
                            <Link
                                key={omni.name}
                                href={`/?tab=suggestions&category=${encodeURIComponent(omni.name)}`}
                                className={`group flex flex-col justify-between rounded-xl border bg-gradient-to-br ${omni.color} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-1">
                                                <img
                                                    src={omni.icon}
                                                    alt={omni.name}
                                                    className="h-10 w-10 object-contain drop-shadow-md"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-display text-base font-bold text-white group-hover:text-[var(--aether-hi)] transition-colors">
                                                    {omni.name}
                                                </h4>
                                                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${omni.pillColor}`}>
                                                    Omnicell
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-[var(--ink-2)]">
                                        {omni.description}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-semibold text-[var(--ink-3)] group-hover:text-white transition-colors">
                                    <span>View {omni.name} Builds</span>
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* WEAPON CLASSES RAIL */}
            <section className="relative px-6 py-16 lg:px-12 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center">
                        <p className="panel-label">Weapon Armory</p>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            All 7 Slayer Weapon Classes
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                            Select a weapon class to view verified meta builds, weapon stats, cell sockets, and special modifications.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                        {WEAPON_CLASSES.map(w => (
                            <Link
                                key={w.id}
                                href={`/?tab=suggestions&weapon=${encodeURIComponent(w.id)}`}
                                className="group flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raise)]/60 p-4 text-center transition-all duration-200 hover:border-[var(--aether-line)] hover:bg-[var(--aether-a10)] hover:scale-105 cursor-pointer"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--line-2)] bg-black/40 p-2 group-hover:border-[var(--aether-line)] transition-colors">
                                    <img
                                        src={w.icon}
                                        alt={w.name}
                                        className="h-10 w-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                                    />
                                </div>
                                <span className="mt-3 font-display text-xs font-bold text-white group-hover:text-[var(--aether-hi)] transition-colors">
                                    {w.name}
                                </span>
                                <span className="mt-1 line-clamp-1 text-[10px] text-[var(--ink-4)]">
                                    {w.role}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ELEMENTAL MATCHUP MATRIX */}
            <section className="relative border-t border-[var(--line)] bg-[var(--bg-raise)]/30 px-6 py-16 lg:px-12">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center">
                        <p className="panel-label">Elemental Affinity</p>
                        <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                            Master Elemental Strengths &amp; Weaknesses
                        </h3>
                        <p className="mt-2 max-w-xl text-xs text-[var(--ink-3)] sm:text-sm">
                            Harness opposing elements to deal +25 power advantage and avoid -25 resistance penalties.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {ELEMENTS.map(elem => (
                            <Link
                                key={elem.name}
                                href={`/?tab=database&element=${elem.name}`}
                                className="flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raise)]/80 p-3.5 text-center transition-all hover:border-white/30 hover:scale-105"
                            >
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg p-1.5"
                                    style={{ backgroundColor: `${elem.color}20`, border: `1px solid ${elem.color}50` }}
                                >
                                    <img src={elem.icon} alt={elem.name} className="h-7 w-7 object-contain" />
                                </div>
                                <span className="mt-2.5 text-xs font-bold text-white" style={{ color: elem.color }}>
                                    {elem.name}
                                </span>
                                <span className="text-[10px] text-[var(--ink-3)]">
                                    Strong vs {elem.vs}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* DISCORD PREVIEWS & LINK SHARING */}
            <section className="relative px-6 py-16 lg:px-12 lg:py-24">
                <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--line-2)] bg-gradient-to-b from-[var(--bg-raise)] to-[#070e17] p-8 shadow-2xl lg:p-12">
                    <div className="grid items-center gap-8 md:grid-cols-2">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400">
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Rich Discord Social Cards</span>
                            </div>
                            <h3 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                                Share Live Build Cards in Any Channel
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                                Every saved loadout generates a dynamic 1200×630 Open Graph card with real item icons, elemental strengths, perk points, and weapon bond details.
                            </p>
                            <div className="mt-6 flex flex-col gap-2.5 text-xs text-[var(--ink-3)]">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                                    <span>High-resolution visual embed directly in Discord chat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                                    <span>1-click import link for your guildmates and party</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                                    <span>Fast serverless generation with 24-hour edge caching</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Mock Card */}
                        <div className="flex flex-col rounded-xl border border-[#2b2d31] bg-[#1e1f22] p-4 text-xs shadow-xl font-sans">
                            <div className="flex items-center gap-2 pb-3 border-b border-[#2b2d31]">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#23a55a]" />
                                <span className="font-bold text-white">Mystic Builder Embed</span>
                                <span className="rounded bg-[#5865f2] px-1.5 py-0.2 text-[9px] font-bold text-white">BOT</span>
                            </div>
                            <div className="mt-3 rounded-lg border-l-4 border-[var(--aether)] bg-[#2b2d31]/50 p-3.5">
                                <p className="font-semibold text-[var(--aether-hi)] text-sm">
                                    Discipline Crit Striker • Dauntless 1.14.7
                                </p>
                                <p className="mt-1 text-[#949ba4] text-[11px] leading-relaxed">
                                    Chaos &amp; Entropy + Thrax Bond • +6 Predator, +6 Cunning, +6 Pulse, +6 Catalyst
                                </p>
                                <div className="mt-3 flex items-center justify-between text-[10px] text-[#b5bac1]">
                                    <span>Shared via mysticparadox.com</span>
                                    <span className="text-[var(--gold)] font-bold">Awakening UI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BOTTOM CALL TO ACTION */}
            <section className="relative px-6 py-20 text-center lg:py-28">
                <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-25 select-none">
                    <img
                        src="/assets/awakening-ui/loadout/GildWingsGold.png"
                        alt=""
                        className="h-auto w-[800px] max-w-none md:w-[1000px]"
                        aria-hidden="true"
                    />
                </div>

                <div className="mx-auto max-w-3xl">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        Ready to Hunt, Slayer?
                    </h2>
                    <p className="mt-4 text-base text-[var(--ink-2)]">
                        Launch the builder to craft, optimize, and share your Dauntless 1.14.7 loadouts today.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 rounded-xl bg-gradient-to-r from-[var(--aether)] to-[#38bdf8] px-8 text-sm font-bold text-black shadow-[0_0_25px_rgba(91,163,255,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(91,163,255,0.6)] cursor-pointer"
                        >
                            <Link href="/?tab=builder" className="inline-flex items-center gap-2">
                                <Hammer className="h-4 w-4" />
                                <span>Start Building Now</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
