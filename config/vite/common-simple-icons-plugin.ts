// Provides the Vite virtual module that exposes the app's common Simple Icons subset.
import * as simpleIcons from "simple-icons";
import type { Plugin } from "vite";

import { COMMON_SIMPLE_ICON_SLUGS } from "../../src/domain/common-simple-icon-slugs";

/** Emits only the maintained common Simple Icons subset into the client bundle. */
export function commonSimpleIconsPlugin(): Plugin {
  return {
    name: "link-deck-common-simple-icons",
    resolveId(id) {
      return id === commonSimpleIconsModuleId ? resolvedCommonSimpleIconsModuleId : null;
    },
    load(id) {
      if (id !== resolvedCommonSimpleIconsModuleId) {
        return null;
      }

      const simpleIconExports: unknown[] = Object.values(simpleIcons);
      const iconBySlug = new Map(
        simpleIconExports.filter(isSimpleIconData).map((icon) => [icon.slug, icon] as const),
      );
      const missingSlugs = COMMON_SIMPLE_ICON_SLUGS.filter((slug) => !iconBySlug.has(slug));

      if (missingSlugs.length > 0) {
        throw new Error(`Unknown Simple Icons slugs: ${missingSlugs.join(", ")}`);
      }

      const commonIcons = COMMON_SIMPLE_ICON_SLUGS.map(
        (slug) => iconBySlug.get(slug) as SimpleIconData,
      );
      const commonIconTuples = commonIcons.map(({ slug, title, hex, path }) => [
        slug,
        title,
        hex,
        path,
      ]);

      return `const iconData = ${JSON.stringify(commonIconTuples)};\nexport const COMMON_SIMPLE_ICONS = iconData.map(([slug, title, hex, path]) => ({ slug, title, hex, path }));`;
    },
  };
}

const commonSimpleIconsModuleId = "virtual:common-simple-icons";
const resolvedCommonSimpleIconsModuleId = `\0${commonSimpleIconsModuleId}`;

type SimpleIconData = {
  slug: string;
  title: string;
  hex: string;
  path: string;
};

/** Checks package exports before using them in the virtual common-icons module. */
function isSimpleIconData(value: unknown): value is SimpleIconData {
  return (
    value !== null &&
    typeof value === "object" &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "hex" in value &&
    typeof value.hex === "string" &&
    "path" in value &&
    typeof value.path === "string"
  );
}
