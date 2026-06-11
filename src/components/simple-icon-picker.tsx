// Built-in Simple Icons picker used by the link add and edit dialog.

import { useEffect, useMemo, useState } from "react";
import { Check, Link as LinkIconGlyph, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InterfaceSizeConfig } from "@/domain/interface-size";
import {
  createBuiltinIconRef,
  getRandomDefaultBuiltinIcon,
  isGenericLinkBuiltinIcon,
  loadBuiltinIcon,
  searchBuiltinIcons,
  type BuiltinIconSearchResult,
} from "@/domain/simple-icons";
import type { LinkIcon } from "@/domain/types";
import { cn } from "@/lib/utils";

type BuiltinIconValue = Extract<LinkIcon, { type: "builtin" }>;

type SimpleIconPickerProps = {
  value: BuiltinIconValue | null;
  disabled?: boolean;
  interfaceSizeConfig: InterfaceSizeConfig;
  onChange: (icon: BuiltinIconValue) => void;
};

type BuiltinIconFieldProps = SimpleIconPickerProps;

type SimpleIconPreviewProps = {
  icon: BuiltinIconSearchResult;
  className?: string;
  decorative?: boolean;
};

/** Returns field button spacing that keeps top, bottom, and right inset balanced. */
function getBuiltinIconActionInsetClassName(
  buttonSize: InterfaceSizeConfig["control"]["buttonSize"],
) {
  return buttonSize === "default" ? "py-1 pr-[3px] pl-3" : "py-0.5 pr-px pl-3";
}

/** Displays a Simple Icons path using its brand color. */
function SimpleIconPreview({ icon, className, decorative = false }: SimpleIconPreviewProps) {
  const [loadedIcon, setLoadedIcon] = useState<{
    path: string | null;
    slug: string;
  } | null>(null);
  const isGenericLinkIcon = isGenericLinkBuiltinIcon(icon.slug);

  useEffect(() => {
    let canceled = false;

    if (isGenericLinkIcon) {
      return undefined;
    }

    void loadBuiltinIcon(icon.slug)
      .then((loadedIcon) => {
        if (!canceled) {
          setLoadedIcon({ slug: icon.slug, path: loadedIcon?.path ?? null });
        }
      })
      .catch(() => undefined);

    return () => {
      canceled = true;
    };
  }, [icon.slug, isGenericLinkIcon]);

  if (isGenericLinkIcon) {
    return (
      <LinkIconGlyph
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : icon.title}
        className={cn("size-4 shrink-0", className)}
        style={{ color: `#${icon.hex}` }}
      />
    );
  }

  const path = loadedIcon?.slug === icon.slug ? loadedIcon.path : null;

  if (!path) {
    return (
      <span
        className={cn("size-4 shrink-0 rounded-sm", className)}
        style={{ backgroundColor: `#${icon.hex}` }}
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : icon.title}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : icon.title}
      className={cn("size-4 shrink-0", className)}
      fill={`#${icon.hex}`}
    >
      <path d={path} />
    </svg>
  );
}

/** Shows the current built-in icon and opens the secondary chooser dialog. */
export function BuiltinIconField({
  value,
  disabled = false,
  interfaceSizeConfig,
  onChange,
}: BuiltinIconFieldProps) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [draftIcon, setDraftIcon] = useState<BuiltinIconValue | null>(value);
  const selectedIcon = useMemo(
    () => (value ? { slug: value.slug, title: value.title, hex: value.hex } : null),
    [value],
  );

  /** Opens the chooser with the current saved draft value. */
  function handleOpenChooser(): void {
    setDraftIcon(value);
    setChooserOpen(true);
  }

  /** Replaces the current icon with a curated random choice. */
  async function handleRandomIcon(): Promise<void> {
    if (disabled) {
      return;
    }

    onChange(await getRandomDefaultBuiltinIcon(value?.slug));
  }

  /** Commits the icon selected inside the chooser dialog. */
  function handleUseIcon(): void {
    if (!draftIcon) {
      return;
    }

    onChange(draftIcon);
    setChooserOpen(false);
  }

  return (
    <>
      <div className={interfaceSizeConfig.dialog.fieldClassName}>
        <Label className={interfaceSizeConfig.control.labelClassName}>Built-in icon</Label>
        <div
          className={cn(
            interfaceSizeConfig.control.inputClassName,
            "flex items-center gap-3 border border-input bg-card shadow-xs",
            getBuiltinIconActionInsetClassName(interfaceSizeConfig.control.buttonSize),
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            {selectedIcon ? (
              <SimpleIconPreview icon={selectedIcon} className="size-5" />
            ) : (
              <span className="size-5 rounded-sm bg-muted" aria-hidden="true" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {value?.title ?? "No icon selected"}
              </span>
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size={interfaceSizeConfig.control.iconButtonSize}
              disabled={disabled}
              className="bg-background"
              aria-label="Random built-in icon"
              onClick={() => void handleRandomIcon()}
            >
              <Shuffle aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={disabled}
              className="bg-background"
              onClick={handleOpenChooser}
            >
              Choose
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent
          className={cn(
            "grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
            interfaceSizeConfig.dialog.surfaceClassName,
          )}
        >
          <DialogHeader className={interfaceSizeConfig.dialog.headerClassName}>
            <DialogTitle className={interfaceSizeConfig.dialog.titleClassName}>
              Choose built-in icon
            </DialogTitle>
            <DialogDescription className={interfaceSizeConfig.dialog.descriptionClassName}>
              Search Simple Icons and confirm the icon for this link.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0">
            <SimpleIconPicker
              value={draftIcon}
              disabled={disabled}
              interfaceSizeConfig={interfaceSizeConfig}
              onChange={setDraftIcon}
            />
          </div>

          <DialogFooter className={interfaceSizeConfig.dialog.footerClassName}>
            <Button
              type="button"
              variant="outline"
              size={interfaceSizeConfig.control.buttonSize}
              onClick={() => setChooserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={!draftIcon}
              onClick={handleUseIcon}
            >
              Use icon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Lets the user search and choose a serializable built-in icon reference. */
export function SimpleIconPicker({
  value,
  disabled = false,
  interfaceSizeConfig,
  onChange,
}: SimpleIconPickerProps) {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<{
    query: string | null;
    results: BuiltinIconSearchResult[];
  }>({ query: null, results: [] });
  const selectedIcon = useMemo(
    () => (value ? { slug: value.slug, title: value.title, hex: value.hex } : null),
    [value],
  );
  const isLoading = searchState.query !== query;
  const results = searchState.results;

  useEffect(() => {
    let canceled = false;

    void searchBuiltinIcons(query)
      .then((nextResults) => {
        if (!canceled) {
          setSearchState({ query, results: nextResults });
        }
      })
      .catch(() => {
        if (!canceled) {
          setSearchState({ query, results: [] });
        }
      });

    return () => {
      canceled = true;
    };
  }, [query]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border bg-secondary/20 p-3">
      {value ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            {selectedIcon ? (
              <SimpleIconPreview icon={selectedIcon} className="size-5" decorative />
            ) : (
              <span
                className="size-5 rounded-sm"
                style={{ backgroundColor: `#${value.hex}` }}
                aria-hidden="true"
              />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{value.title}</span>
            </span>
          </span>
          <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
        </div>
      ) : null}

      <div className={interfaceSizeConfig.dialog.fieldClassName}>
        <Label
          htmlFor="link-dialog-builtin-icon-search"
          className={interfaceSizeConfig.control.labelClassName}
        >
          Search built-in icons
        </Label>
        <Input
          id="link-dialog-builtin-icon-search"
          className={interfaceSizeConfig.control.inputClassName}
          value={query}
          placeholder="Search brands, for example GitHub"
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div data-result-list className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <p className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground">
            Loading built-in icons...
          </p>
        </div>
      ) : results.length ? (
        <div data-result-list className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-2 sm:grid-cols-3">
            {results.map((icon) => {
              const selected = value?.slug === icon.slug;

              return (
                <Button
                  key={icon.slug}
                  type="button"
                  variant={selected ? "secondary" : "ghost"}
                  className={cn(
                    "h-[38px] justify-start gap-2 border border-transparent px-2 text-left",
                    selected && "border-accent/50",
                  )}
                  disabled={disabled}
                  onClick={() => onChange(createBuiltinIconRef(icon))}
                >
                  <SimpleIconPreview icon={icon} decorative />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{icon.title}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div data-result-list className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <p className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground">
            No built-in icons match this search.
          </p>
        </div>
      )}
    </div>
  );
}
