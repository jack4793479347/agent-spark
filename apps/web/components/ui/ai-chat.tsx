"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowUpIcon,
    Briefcase,
    Code,
    Mail,
    ShoppingCart,
    PenTool,
    BarChart3,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;

            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

const CATEGORIES = [
    { label: "Business", icon: Briefcase },
    { label: "Marketing", icon: BarChart3 },
    { label: "Email", icon: Mail },
    { label: "E-Commerce", icon: ShoppingCart },
    { label: "Content", icon: PenTool },
    { label: "Dev", icon: Code },
];

export function AiChat({
    value,
    onChange,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: (v: string) => void;
}) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 200,
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                onSubmit(value);
                onChange("");
                adjustHeight(true);
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full mx-auto">
            {/* Category pills */}
            <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.label;
                    return (
                        <button
                            key={cat.label}
                            type="button"
                            onClick={() => setActiveCategory(isActive ? null : cat.label)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                "backdrop-blur-md border",
                                isActive
                                    ? "bg-white/70 border-white/80 text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
                                    : "bg-white/30 border-white/50 text-neutral-500 hover:bg-white/50 hover:text-neutral-700 hover:border-white/70"
                            )}
                        >
                            <Icon className="w-3 h-3" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Glass input */}
            <div className="w-full">
                <div className="overflow-y-auto">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={activeCategory ? `What do you need help with in ${activeCategory}?` : "What can I help you orchestrate?"}
                        className={cn(
                            "w-full px-5 py-4",
                            "resize-none",
                            "bg-transparent",
                            "border-none",
                            "text-neutral-800 text-sm",
                            "focus:outline-none",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "placeholder:text-neutral-400 placeholder:text-sm",
                            "min-h-[52px]"
                        )}
                        style={{ overflow: "hidden" }}
                    />
                </div>

                <div className="flex items-center justify-end px-3 pb-3">
                    <button
                        type="button"
                        onClick={() => { if (value.trim()) { onSubmit(value); onChange(""); adjustHeight(true); } }}
                        className={cn(
                            "px-1.5 py-1.5 rounded-lg text-sm transition-all flex items-center justify-between gap-1",
                            value.trim()
                                ? "bg-neutral-900 text-white border border-neutral-900 shadow-md"
                                : "text-neutral-400 border border-neutral-300/60 hover:border-neutral-400/60 hover:bg-white/30"
                        )}
                    >
                        <ArrowUpIcon
                            className={cn(
                                "w-4 h-4",
                                value.trim()
                                    ? "text-white"
                                    : "text-neutral-400"
                            )}
                        />
                        <span className="sr-only">Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
