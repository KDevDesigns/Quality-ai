/** A short label such as "Chrome on Windows" from a browser's user agent, so people can tell their devices apart. */
export function deviceLabel(ua: string): string {
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /Firefox\/|FxiOS/.test(ua) ? "Firefox"
    : /Chrome\/|CriOS/.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser";
  const os =
    /iPhone|iPad|iPod/.test(ua) ? "iPhone/iPad"
    : /Android/.test(ua) ? "Android"
    : /Windows/.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/.test(ua) ? "Mac"
    : /Linux/.test(ua) ? "Linux"
    : "unknown device";
  return `${browser} on ${os}`;
}
