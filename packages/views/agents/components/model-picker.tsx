"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import type { RuntimeDevice } from "@multica/core/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@multica/ui/components/ui/popover";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";

/**
 * Model picker that shows a dropdown of available models from the runtime
 * metadata, with a free-text fallback. Empty value means "use daemon default".
 */
export function ModelPicker({
  runtime,
  value,
  onChange,
}: {
  runtime: RuntimeDevice | null;
  value: string;
  onChange: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = runtime?.metadata as Record<string, unknown> | undefined;
  const defaultModel = typeof meta?.model === "string" ? meta.model : "";
  const availableModels = Array.isArray(meta?.models)
    ? (meta.models as string[])
    : [];

  // Sync custom input when value changes externally
  useEffect(() => {
    if (value && !availableModels.includes(value)) {
      setCustomInput(value);
    }
  }, [value, availableModels]);

  if (!runtime) return null;

  // If no models list from daemon, show a simple text input
  if (availableModels.length === 0) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground">Model</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultModel ? `Default: ${defaultModel}` : "e.g. claude-sonnet-4-20250514"}
          className="mt-1"
        />
        {defaultModel && !value && (
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty to use daemon default
          </p>
        )}
      </div>
    );
  }

  // Dropdown with available models + free-text custom option
  const displayValue = value || (defaultModel ? `${defaultModel} (default)` : "Select model...");

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Model</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 mt-1 text-left text-sm transition-colors hover:bg-muted"
        >
          <span className={`min-w-0 flex-1 truncate ${!value ? "text-muted-foreground" : ""}`}>
            {displayValue}
          </span>
          {value && (
            <span
              role="button"
              tabIndex={0}
              className="shrink-0 rounded-sm p-0.5 hover:bg-accent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--anchor-width)] p-1 max-h-72 overflow-y-auto">
          {/* Default option */}
          {defaultModel && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                !value ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <span className="truncate">{defaultModel}</span>
              <span className="shrink-0 text-xs text-muted-foreground">(default)</span>
            </button>
          )}

          {/* Available models */}
          {availableModels
            .filter((m) => m !== defaultModel)
            .map((model) => (
              <button
                key={model}
                onClick={() => { onChange(model); setOpen(false); }}
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  value === model ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <span className="truncate">{model}</span>
              </button>
            ))}

          {/* Custom input */}
          <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
            <div className="flex items-center gap-1.5">
              <Input
                ref={inputRef}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Custom model..."
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) {
                    onChange(customInput.trim());
                    setOpen(false);
                  }
                }}
              />
              <button
                type="button"
                disabled={!customInput.trim()}
                onClick={() => {
                  if (customInput.trim()) {
                    onChange(customInput.trim());
                    setOpen(false);
                  }
                }}
                className="shrink-0 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {defaultModel && !value && (
        <p className="mt-1 text-xs text-muted-foreground">
          Using daemon default
        </p>
      )}
    </div>
  );
}
