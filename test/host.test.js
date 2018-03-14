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
} = require('../config');


let ip_addr = (require('ip').address());
console.log("Connecting: " + ip_addr + ":" + system.port);
const ws_local = new WebSocket('ws://' + (require('ip').address()) + ':' + system.port);
ws_local.on('open', function open() {
  //ws_local.send('close');
});
var direct;
ws_local.on('message', function incoming(data) {
  direct(data);
});

function finish() {
  ws_local.send('close');
  var log_data = fs.readFileSync('.log', 'utf8');
  console.log(log_data);
}

// Test the key pairing system
var server_key;
test('Key pairing Test', done => {
  direct = function(data) {
    let msg = JSON.parse(data);
    expect(msg.code).toBeDefined();
    expect(msg.code).toEqual(6);
    expect(msg.msg).toBeDefined();
    expect(msg.msg).toEqual("Key Set");
    expect(msg.data).toBeDefined();
    expect(msg.data).not.toBeNull();
    server_key = md5(msg.data + '-test_key');
    done();
  }
});


// Test the tree function
test('Test <Tree>', done => {
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    expect(msg.code).toEqual(1);
    expect(msg.msg).toBeDefined();
    expect(msg.msg).toEqual("200 OK");
    expect(msg.data).toBeDefined();
    expect(msg.data).not.toBeNull();
    // Check that there are 10 elements
    expect(msg.data.length).toEqual(10);
    // Check that file 4 is correct
    let dat = msg.data[4];
    expect(dat.type).toEqual('file');
    expect(dat.path).toEqual('dir2/file5.txt');
    expect(dat.ext).toEqual('.txt');
    expect(dat.hash).toEqual(md5('dir2/file5.txt'));
    // Check that file 8 is correct
    dat = msg.data[8];
    expect(dat.type).toEqual('file');
    expect(dat.path).toEqual('file1.js');
    expect(dat.ext).toEqual('.js');
    expect(dat.hash).toEqual(md5('file1.js'));
    // Check that file 7 is correct
    dat = msg.data[7];
    expect(dat.type).toEqual('dir');
    expect(dat.path).toEqual('dir3');
    expect(dat.ext).toEqual('');
    expect(dat.hash).toEqual(md5('dir3'));
    // All done
    finish();
    done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["tree", "./"],
    "callback": "callback_tree"
  }));
});