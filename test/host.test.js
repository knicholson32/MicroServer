// Imports using require
// Import websocket package
const WebSocket = require('ws');
// Import file system packages
var fs = require('file-system');
const path = require('path');
// Import MD5 Hash
var md5 = require('md5');



let ip_addr = (require('ip').address());
console.log("Connecting: " + ip_addr + ":" + 8081);

const ws_local = new WebSocket('ws://' + (require('ip').address()) + ':' + 8081);
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
test('Check Key pairing', done => {
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

// Test client denial
test('Check Client Denial', done => {
  let received_denial_message = false;
  const ws_local_den = new WebSocket('ws://' + (require('ip').address()) + ':' + 8081);
  ws_local_den.on('close', function open() {
    if (received_denial_message === true) {
      done();
    } else {
      throw new Error('Denial Message was not received.');
    }
  });
  var direct;
  ws_local_den.on('message', function incoming(data) {
    //{"code":0,"msg":"Max number of connections reached. Disconnecting.","data":[]}
    let msg = JSON.parse(data);
    expect(msg.code).toEqual(0);
    expect(msg.msg).toEqual("Max number of connections reached. Disconnecting.");
    expect(msg.data).toEqual([]);
    received_denial_message = true;
  });
});

// Test the tree function
test('Check <Tree> Command', done => {
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    expect(msg.code).toEqual(1);
    expect(msg.msg).toBeDefined();
    expect(msg.msg).toEqual("200 OK");
    expect(msg.callback).toBeDefined();
    expect(msg.callback).toEqual('callback_tree');
    expect(msg.cmd).toBeDefined();
    expect(msg.cmd).toEqual('tree');
    expect(msg.data).toBeDefined();
    expect(msg.data).not.toBeNull();
    // Check that there are 10 elements
    expect(msg.data.length).toEqual(10);
    // Check that file 4 is correct
    let dat = msg.data[4];
    expect(dat.type).toEqual('file');
    expect(dat.path).toEqual('dir2/file4.txt');
    expect(dat.ext).toEqual('.txt');
    expect(dat.hash).toEqual(md5('dir2/file4.txt'));
    // Check that file 8 is correct
    dat = msg.data[8];
    expect(dat.type).toEqual('dir');
    expect(dat.path).toEqual('dir3');
    expect(dat.ext).toEqual('');
    expect(dat.hash).toEqual(md5('dir3'));
    // Check that file 7 is correct
    dat = msg.data[7];
    expect(dat.type).toEqual('file');
    expect(dat.path).toEqual('dir3/file6.txt');
    expect(dat.ext).toEqual('.txt');
    expect(dat.hash).toEqual(md5('dir3/file6.txt'));
    done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["tree", "./"],
    "callback": "callback_tree"
  }));
});

// Test the load function
test('Check <load> Command Part 1', done => {
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    expect(msg.code).toEqual(1);
    expect(msg.msg).toBeDefined();
    expect(msg.msg).toEqual("200 OK");
    expect(msg.callback).toBeDefined();
    expect(msg.callback).toEqual('callback_load');
    expect(msg.cmd).toBeDefined();
    expect(msg.cmd).toEqual('load');
    expect(msg.data).toBeDefined();
    expect(msg.data).not.toBeNull();
    expect(msg.data.name).toEqual('file3.txt');
    expect(msg.data.size).toEqual(15);
    expect(msg.data.enc).toEqual('utf-8');
    expect(msg.data.data).toEqual('This is file 3\n');
    done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["load", "utf-8", "dir1/dir4/file3.txt"],
    "callback": "callback_load"
  }));
});

// Test the save function
test('Check <save> Command', done => {
  let received_save_confirm = false;
  let received_file_update = false;
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    if (msg.code === 7) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("directory/file update");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('file_tree_refresh');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('file_tree_refresh');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data.length).toEqual(3);
      expect(msg.data[0]).toEqual('files/dir1/file1.js');
      expect(msg.data[1]).toEqual('This is file 1 (javascript) write');
      expect(msg.data[2]).toEqual('update');
      received_file_update = true;
    } else if (msg.code === 1) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("200 OK");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_save');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('save');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual([]);
      received_save_confirm = true;
    } else {
      throw new Error("[save] Unexpected return code: " + msg.code);
    }

    if (received_file_update === true && received_save_confirm === true)
      done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["save", "utf-8", "dir1/file1.js", "This is file 1 (javascript) write"],
    "callback": "callback_save"
  }));
});

// Test the save function
test('Check <save> Command -> Append', done => {
  let received_save_confirm = false;
  let received_file_update = false;
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    if (msg.code === 7) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("directory/file update");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('file_tree_refresh');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('file_tree_refresh');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data.length).toEqual(3);
      expect(msg.data[0]).toEqual('files/dir1/file1.js');
      expect(msg.data[1]).toEqual('This is file 1 (javascript) write - EDITED!');
      expect(msg.data[2]).toEqual('update');
      received_file_update = true;
    } else if (msg.code === 1) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("200 OK");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_save_append');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('save');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual([]);
      received_save_confirm = true;
    } else {
      throw new Error("[save] Unexpected return code: " + msg.code);
    }
    if (received_file_update === true && received_save_confirm === true)
      done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["save", "append", "dir1/file1.js", " - EDITED!"],
    "callback": "callback_save_append"
  }));
});

// Test the load function
test('Check <load> Command Part 2', done => {
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    expect(msg.code).toEqual(1);
    expect(msg.msg).toBeDefined();
    expect(msg.msg).toEqual("200 OK");
    expect(msg.callback).toBeDefined();
    expect(msg.callback).toEqual('callback_load');
    expect(msg.cmd).toBeDefined();
    expect(msg.cmd).toEqual('load');
    expect(msg.data).toBeDefined();
    expect(msg.data).not.toBeNull();
    expect(msg.data.name).toEqual('file1.js');
    expect(msg.data.size).toEqual(43);
    expect(msg.data.enc).toEqual('utf-8');
    expect(msg.data.data).toEqual('This is file 1 (javascript) write - EDITED!');
    done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["load", "utf-8", "dir1/file1.js"],
    "callback": "callback_load"
  }));
});

// Test the delete function
test('Check <delete> Command', done => {
  let received_del_confirm = false;
  let received_file_update = false;
  direct = function(data) {
    // Parse Data
    let msg = JSON.parse(data);
    // Check that the correct status code and message is present
    expect(msg.code).toBeDefined();
    if (msg.code === 7) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("directory/file update");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('file_tree_refresh');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('file_tree_refresh');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data.length).toEqual(3);
      expect(msg.data[0]).toEqual('files/file2.txt');
      expect(msg.data[1]).toEqual('');
      expect(msg.data[2]).toEqual('delete');
      received_file_update = true;
    } else if (msg.code === 1) {
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("200 OK");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_delete');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('delete');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual([]);
      received_del_confirm = true;
    } else {
      throw new Error("[save] Unexpected return code: " + msg.code);
    }
    if (received_del_confirm === true && received_file_update === true)
      done();
  };
  ws_local.send(JSON.stringify({
    "key": server_key,
    "request": ["delete", "./file2.txt"],
    "callback": "callback_delete"
  }));
});

afterAll(() => {
  finish();
});