"use client";

import { cn } from "@/lib/utils";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ChatInputContextValue {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onSubmit?: () => void;
    loading?: boolean;
    variant?: "default" | "unstyled";
    rows?: number;
}

const ChatInputContext = createContext<ChatInputContextValue>({});

interface ChatInputProps extends Omit<ChatInputContextValue, "variant"> {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "unstyled";
    rows?: number;
}

function ChatInput({
    children,
    className,
    variant = "default",
    value,
    onChange,
    onSubmit,
    loading,
    rows = 1,
}: ChatInputProps) {
    const contextValue: ChatInputContextValue = {
        value,
        onChange,
        onSubmit,
        loading,
        variant,
        rows,
    };

    return (
        <ChatInputContext.Provider value={contextValue}>
            <div
                className={cn(
                    variant === "default" &&
                        "relative flex flex-col items-end w-full p-1.5 rounded-2xl border border-neutral-200/70 bg-white focus-within:border-neutral-300 focus-within:outline-none transition-colors",
                    variant === "unstyled" && "flex items-start gap-2 w-full",
                    className,
                )}
            >
                {children}
            </div>
        </ChatInputContext.Provider>
    );
}

ChatInput.displayName = "ChatInput";

interface ChatInputTextAreaProps {
    placeholders?: string[];
    className?: string;
}

function ChatInputTextArea({
    placeholders = [],
    className,
}: ChatInputTextAreaProps) {
    const context = useContext(ChatInputContext);
    const value = context.value ?? "";
    const onChange = context.onChange;
    const onSubmit = context.onSubmit;
    const rows = context.rows ?? 1;

    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

    useEffect(() => {
        if (placeholders.length === 0) return;
        const interval = setInterval(() => {
            setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders]);

    const textareaRef = useTextareaResize(value, rows);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!onSubmit) return;
        if (e.key === "Enter" && !e.shiftKey) {
            if (typeof value !== "string" || value.trim().length === 0) return;
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange?.({ target: e.target } as React.ChangeEvent<HTMLTextAreaElement>)}
                onKeyDown={(e) => {
                    if (!onSubmit) return;
                    if (e.key === "Enter") {
                        if (typeof value !== "string" || value.trim().length === 0) return;
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                className={cn(
                    "w-full h-9 bg-transparent pl-3 pr-3 text-sm text-foreground placeholder:text-transparent border-none focus:outline-none focus-visible:ring-0 shadow-none",
                    className,
                )}
            />
            {/* Animated placeholder — same position as input text */}
            {!value && placeholders.length > 0 && (
                <div className="absolute inset-0 flex items-center pl-3 pointer-events-none overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentPlaceholder}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="text-sm text-neutral-400 truncate"
                        >
                            {placeholders[currentPlaceholder]}
                        </motion.span>
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

ChatInputTextArea.displayName = "ChatInputTextArea";

function ChatInputSubmit({ className }: { className?: string }) {
    const context = useContext(ChatInputContext);
    const onSubmit = context.onSubmit;
    const isDisabled =
        typeof context.value !== "string" || context.value.trim().length === 0;

    return (
        <button
            className={cn(
                "shrink-0 rounded-full p-2 h-fit transition-all",
                isDisabled
                    ? "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                    : "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 cursor-pointer",
                className,
            )}
            disabled={isDisabled}
            onClick={(e) => {
                e.preventDefault();
                if (!isDisabled) onSubmit?.();
            }}
        >
            <ArrowRight className="w-4 h-4" />
        </button>
    );
}

ChatInputSubmit.displayName = "ChatInputSubmit";

export { ChatInput, ChatInputTextArea, ChatInputSubmit };
