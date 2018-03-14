// Imports using require
// Import websocket package
const WebSocket = require('ws');
// Import file system packages
var fs = require('file-system');
const path = require('path');
// Import MD5 Hash
var md5 = require('md5');

const {
  id,
  md5_key,
  createID,
  system
} = require('./config');

const {
  process,
  resolvePath,
  log,
  wss
} = require('./host');



test('Log Tests', () => {
  expect(log).toBeDefined();
  fs.unlinkSync(system.log);
  log("Log Test", false);
  var data = fs.readFileSync(system.log, 'utf8');
  expect(data).toEqual('Log Test\n');
});

test('Resolve Path Tests', () => {
  expect(resolvePath).toBeDefined();
});

test('Process Tests', () => {
  expect(process).toBeDefined();
});

test('Close WSS', () => {
  wss.close();
});