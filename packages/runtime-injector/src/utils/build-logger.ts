export function buildLogger({
  identifier,
  debug,
}: {
  identifier: string;
  debug?: boolean;
}) {
  const prefix = `[${identifier}] `;
  return {
    log: console.log.bind(console, prefix),
    info: debug ? console.info.bind(console, prefix) : () => {},
    error: console.error.bind(console, prefix),
    warn: debug ? console.warn.bind(console, prefix) : () => {},
    debug: debug ? console.debug.bind(console, prefix) : () => {},
  };
}
