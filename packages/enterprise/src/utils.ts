import * as url from "url";

export function host(targetUrl: string): string | undefined {
  const { host: targetHost } = url.parse(targetUrl);

  return targetHost ?? undefined;
}
