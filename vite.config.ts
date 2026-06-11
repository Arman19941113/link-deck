import path from "node:path";
import * as simpleIcons from "simple-icons";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { COMMON_SIMPLE_ICON_SLUGS } from "./src/domain/common-simple-icon-slugs";

const siteBasePath = process.env.VITE_BASE_PATH ?? "/";
const commonSimpleIconsModuleId = "virtual:common-simple-icons";
const resolvedCommonSimpleIconsModuleId = `\0${commonSimpleIconsModuleId}`;
const escapeRegexSegment = (value: string) => value.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
const pathSeparatorPattern = String.raw`[\\/]`;

type VendorPackageMatcher = string | RegExp;
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

function normalizePackageRegex(matcher: RegExp): string {
  return matcher.source
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, pathSeparatorPattern)
    .replace(/\//g, pathSeparatorPattern);
}

function normalizePackageMatcher(matcher: VendorPackageMatcher): string {
  if (typeof matcher !== "string") {
    return normalizePackageRegex(matcher);
  }

  return `${matcher.split("/").map(escapeRegexSegment).join(pathSeparatorPattern)}(?:${pathSeparatorPattern}|$)`;
}

/** Creates a pnpm-compatible vendor package matcher for Rolldown chunk groups. */
function vendorPackagePattern(matchers: VendorPackageMatcher[]): RegExp {
  const packagePattern = matchers.map(normalizePackageMatcher).join("|");

  return new RegExp(
    String.raw`node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:${packagePattern})`,
  );
}

/** Emits only the maintained common Simple Icons subset into the client bundle. */
function commonSimpleIconsPlugin(): Plugin {
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

// https://vite.dev/config/
export default defineConfig({
  base: siteBasePath,
  plugins: [commonSimpleIconsPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: vendorPackagePattern(["react", "react-dom", "scheduler"]),
              priority: 50,
            },
            {
              name: "vendor-pinyin",
              test: vendorPackagePattern(["pinyin-pro"]),
              priority: 40,
            },
            {
              name: "vendor-dnd",
              test: vendorPackagePattern([/^@dnd-kit\//]),
              priority: 30,
            },
            {
              name: "vendor-ui",
              test: vendorPackagePattern([
                "radix-ui",
                /^@radix-ui\//,
                /^@floating-ui\//,
                "react-remove-scroll",
                "lucide-react",
                "sonner",
              ]),
              priority: 20,
            },
            {
              name: "vendors",
              test: /node_modules[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
