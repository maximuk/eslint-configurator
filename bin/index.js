#!/usr/bin/env node

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at: Promise', promise, 'reason:', reason);
  process.exit(1);
});

const colors = require('colors/safe');

const command = [
  'init',
  'check',
  'update',
].find(c => process.argv.includes(c));

if (command) {
  require(`../lib/${command}.js`)();
} else {
  console.log(colors.red('No command to run\n'));
  process.exit(1);
}
