export type CookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

export type ParsedCookie = { name: string; value: string; options: CookieOptions };

/** Parses a `Set-Cookie` header so it can be re-applied with Next's `cookies().set()`. */
export function parseSetCookie(header: string): ParsedCookie {
  const [pair, ...attributes] = header.split(';').map((part) => part.trim());
  const index = pair.indexOf('=');
  const name = pair.slice(0, index);
  const value = decodeURIComponent(pair.slice(index + 1));
  const options: CookieOptions = {};

  for (const attribute of attributes) {
    const [rawKey, ...rest] = attribute.split('=');
    const key = rawKey.toLowerCase();
    const attrValue = rest.join('=');
    if (key === 'path') options.path = attrValue;
    else if (key === 'domain') options.domain = attrValue;
    else if (key === 'max-age') options.maxAge = Number(attrValue);
    else if (key === 'expires') options.expires = new Date(attrValue);
    else if (key === 'httponly') options.httpOnly = true;
    else if (key === 'secure') options.secure = true;
    else if (key === 'samesite') options.sameSite = attrValue.toLowerCase() as CookieOptions['sameSite'];
  }

  return { name, value, options };
}
