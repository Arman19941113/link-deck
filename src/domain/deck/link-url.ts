// Provides deck link URL normalization, origin extraction, and favicon URL helpers.

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const EXPLICIT_HTTP_SCHEME = /^https?:\/\//i
const HOST_PORT_PREFIX = /^([^/?#\s:]+):\d+(?=$|[/?#])/
const SCHEME_LIKE_PREFIX = /^[a-zA-Z][a-zA-Z\d+.-]*:/

/** Normalizes user input into an http/https link URL, returning null for invalid input. */
export function normalizeLinkUrl(value: string): string | null {
  const url = parseHttpUrl(value)

  if (!url) {
    return null
  }

  return hasPathSearchOrHash(value.trim()) ? url.toString() : url.origin
}

/** Builds the automatic link favicon URL locally so navigation data is not sent to third-party services. */
export function getAutoFaviconUrl(value: string): string | null {
  const origin = getUrlOrigin(value)

  if (!origin) {
    return null
  }

  return `${origin}/favicon.ico`
}

/** Checks whether raw input contains a path, query, or hash fragment. */
function hasPathSearchOrHash(value: string): boolean {
  const withoutScheme = value.replace(EXPLICIT_HTTP_SCHEME, '')
  return /[/?#]/.test(withoutScheme)
}

/** Extracts the URL origin for domain-based display grouping. */
function getUrlOrigin(value: string): string | null {
  return parseHttpUrl(value)?.origin ?? null
}

/** Parses and restricts URLs to reachable http/https addresses. */
function parseHttpUrl(value: string): URL | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (SCHEME_LIKE_PREFIX.test(trimmed) && !EXPLICIT_HTTP_SCHEME.test(trimmed) && !isHostPortInput(trimmed)) {
    return null
  }

  const withProtocol = EXPLICIT_HTTP_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    return HTTP_PROTOCOLS.has(url.protocol) ? url : null
  } catch {
    return null
  }
}

/** Distinguishes host:port from non-web protocol prefixes. */
function isHostPortInput(value: string): boolean {
  const match = value.match(HOST_PORT_PREFIX)
  return match ? isAllowedHostPortHost(match[1]) : false
}

/** Checks whether a host can receive a protocol as a bare host:port value. */
function isAllowedHostPortHost(host: string): boolean {
  return host.toLocaleLowerCase() === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes('.')
}
