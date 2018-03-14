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

/*test('Log Tests', () => {
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
  setTimeout(function() {
    done();
  }, 500);
  //}, 100);
});

test('Close WSS', () => {
  wss.close();
});*/


test('Process WS Tests', done => {
  //setTimeout(function() {
  let ip_addr = (require('ip').address());
  console.log("Connecting: " + ip_addr + ":" + system.port);
  const ws_local = new WebSocket('ws://' + (require('ip').address()) + ':' + system.port);
  ws_local.on('open', function open() {
    ws_local.send('something');
  });
  ws_local.on('message', function incoming(data) {
    console.log(data);
    done();
  });
  setTimeout(function() {
    done();
  }, 500);
  //}, 100);
});