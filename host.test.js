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

system.ssl = false;

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

test('Process WS Tests', done => {
  expect(process).toBeDefined();
  //setTimeout(function() {
  const ws_local = new WebSocket('ws://localhost:' + system.port);
  ws_local.on('open', function open() {
    ws_local.send('something');
  });
  ws_local.on('message', function incoming(data) {
    console.log(data);
    done();
  });
  //}, 100);
});

test('Close WSS', () => {
  wss.close();
});