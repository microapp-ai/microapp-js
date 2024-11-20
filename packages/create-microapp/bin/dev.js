#!/usr/bin/env node_modules/.bin/ts-node

(async () => {
  const oclif = await import('@oclif/core');

  const argv = process.argv.slice(2);

  if (argv.length === 0 || !argv[0].startsWith('-')) {
    argv.unshift('init');
  }

  await oclif.execute({ development: true, args: argv, dir: __dirname });
})();
