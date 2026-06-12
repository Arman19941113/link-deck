// Defines package-based Rolldown chunk groups for the Vite production build.
export const vendorChunkGroups = [
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
];

type VendorPackageMatcher = string | RegExp;

/** Creates a pnpm-compatible vendor package matcher for Rolldown chunk groups. */
function vendorPackagePattern(matchers: VendorPackageMatcher[]): RegExp {
  const packagePattern = matchers.map(normalizePackageMatcher).join("|");

  return new RegExp(
    String.raw`node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:${packagePattern})`,
  );
}

function normalizePackageMatcher(matcher: VendorPackageMatcher): string {
  if (typeof matcher !== "string") {
    return normalizePackageRegex(matcher);
  }

  return `${matcher.split("/").map(escapeRegexSegment).join(pathSeparatorPattern())}(?:${pathSeparatorPattern()}|$)`;
}

function normalizePackageRegex(matcher: RegExp): string {
  return matcher.source
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, pathSeparatorPattern())
    .replace(/\//g, pathSeparatorPattern());
}

function pathSeparatorPattern(): string {
  return String.raw`[\\/]`;
}

function escapeRegexSegment(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}
