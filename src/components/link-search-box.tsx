// Link search box that filters by saved link title, note, and URL.

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InterfaceSizeConfig } from "@/domain/interface-size";
import { cn } from "@/lib/utils";

type LinkSearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  interfaceSizeConfig: InterfaceSizeConfig;
};

/** Provides link search input with an icon and clear action. */
export function LinkSearchBox({
  value,
  onChange,
  onFocus,
  interfaceSizeConfig,
}: LinkSearchBoxProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="link-search" className="sr-only">
        Search links
      </label>
      <div className="relative">
        <Search className={interfaceSizeConfig.control.searchIconClassName} aria-hidden="true" />
        <Input
          id="link-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          placeholder="Search links, notes, or URLs..."
          className={cn(
            "bg-card shadow-none",
            interfaceSizeConfig.control.inputClassName,
            interfaceSizeConfig.control.searchInputClassName,
          )}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size={interfaceSizeConfig.control.iconButtonSize}
            className={interfaceSizeConfig.control.searchClearButtonClassName}
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
