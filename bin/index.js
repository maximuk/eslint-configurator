#!/usr/bin/env node

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  process.exit(1);
});

require('colors');

const command = [
  'init',
  'check',
  'update',
].find(c => process.argv.includes(c));

if (!command) {
  console.log('No command to run\n'.red);
  process.exit(1);
}

require(`../lib/${command}.js`);
