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

var ws_local = new WebSocket('ws://' + (require('ip').address()) + ':' + 8081);
var direct;
ws_local.on('message', function incoming(data) {
  direct(data);
});

function finish() {
  var log_data = fs.readFileSync('.log', 'utf8');
  console.log(log_data);
}


var username = 'user1';
var password = 'pass1';

// Test the key pairing system
var server_key;
describe('Testing with \'user1\'', () => {
  test('Check Key pairing', done => {
    direct = function(data) {
      let msg = JSON.parse(data);
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(6);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Key Set");
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      server_key = md5(username + '_' + password + '_' + msg.data);
      done();
    };
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
      expect(dat.fp).toEqual(md5('This is file 4\n'));
      // Check that file 8 is correct
      dat = msg.data[8];
      expect(dat.type).toEqual('dir');
      expect(dat.path).toEqual('dir3');
      expect(dat.ext).toEqual('');
      expect(dat.hash).toEqual(md5('dir3'));
      expect(dat.fp).toEqual('');
      // Check that file 7 is correct
      dat = msg.data[7];
      expect(dat.type).toEqual('file');
      expect(dat.path).toEqual('dir3/file6.txt');
      expect(dat.ext).toEqual('.txt');
      expect(dat.hash).toEqual(md5('dir3/file6.txt'));
      expect(dat.fp).toEqual(md5('This is file 6\n'));
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
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/file1.js');
        expect(msg.data[1]).toEqual('This is file 1 (javascript) write');
        expect(msg.data[2]).toEqual('update');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual(md5('This is file 1 (javascript) write'));
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
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/file1.js');
        expect(msg.data[1]).toEqual('This is file 1 (javascript) write - EDITED!');
        expect(msg.data[2]).toEqual('update');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual(md5('This is file 1 (javascript) write - EDITED!'));
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

  // Test the save function
  test('Check <save> Command -> New File', done => {
    let received_save_confirm = false;
    let received_file_update = false;
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/test_dir/new_file.js');
        expect(msg.data[1]).toEqual('This is my new file!');
        expect(msg.data[2]).toEqual('update');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual(md5('This is my new file!'));
        received_file_update = true;
      } else if (msg.code === 1) {
        expect(msg.msg).toBeDefined();
        expect(msg.msg).toEqual("200 OK");
        expect(msg.callback).toBeDefined();
        expect(msg.callback).toEqual('callback_save_new_file');
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
      "request": ["save", "utf-8", "dir1/test_dir/new_file.js", "This is my new file!"],
      "callback": "callback_save_new_file"
    }));
  });


  // Test the load function
  test('Check <load> Command Part 2', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('file2.txt');
        expect(msg.data[1]).toEqual('');
        expect(msg.data[2]).toEqual('delete');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual('');
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
        throw new Error("[delete] Unexpected return code: " + msg.code);
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

  // Test the move function
  test('Check <move> Command', done => {
    let received_del_confirm = false;
    let received_file_update = false;
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/test_dir/new_file.js');
        expect(msg.data[1]).toEqual('dir1/test_dir_move/new_file_move.js');
        expect(msg.data[2]).toEqual('move');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual('');
        received_file_update = true;
      } else if (msg.code === 1) {
        expect(msg.msg).toBeDefined();
        expect(msg.msg).toEqual("200 OK");
        expect(msg.callback).toBeDefined();
        expect(msg.callback).toEqual('callback_move');
        expect(msg.cmd).toBeDefined();
        expect(msg.cmd).toEqual('move');
        expect(msg.data).toBeDefined();
        expect(msg.data).toEqual([]);
        received_del_confirm = true;
      } else {
        throw new Error("[move] Unexpected return code: " + msg.code);
      }
      if (received_del_confirm === true && received_file_update === true)
        done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["move", "dir1/test_dir/new_file.js", "dir1/test_dir_move/new_file_move.js"],
      "callback": "callback_move"
    }));
  });

  // Test the move function
  test('Check <move> Command - Directory', done => {
    let received_del_confirm = false;
    let received_file_update = false;
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/dir4');
        expect(msg.data[1]).toEqual('dir1/dir4_moved');
        expect(msg.data[2]).toEqual('move');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual('');
        received_file_update = true;
      } else if (msg.code === 1) {
        expect(msg.msg).toBeDefined();
        expect(msg.msg).toEqual("200 OK");
        expect(msg.callback).toBeDefined();
        expect(msg.callback).toEqual('callback_move');
        expect(msg.cmd).toBeDefined();
        expect(msg.cmd).toEqual('move');
        expect(msg.data).toBeDefined();
        expect(msg.data).toEqual([]);
        received_del_confirm = true;
      } else {
        throw new Error("[copy] Unexpected return code: " + msg.code);
      }
      if (received_del_confirm === true && received_file_update === true)
        done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["move", "dir1/dir4", "dir1/dir4_moved"],
      "callback": "callback_move"
    }));
  });

  // Test the move function with tree
  test('Check <move> Command -> tree Part 1', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
      // Check that there are 0 elements
      expect(msg.data.length).toEqual(0);
      expect(msg.data).toEqual([]);
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["tree", "dir1/test_dir"],
      "callback": "callback_tree"
    }));
  });

  // Test the move function with tree
  test('Check <move> Command -> tree Part 2', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
      // Check that there are 0 elements
      expect(msg.data.length).toEqual(1);
      let dat = msg.data[0];
      expect(dat.type).toEqual('file');
      expect(dat.path).toEqual('new_file_move.js');
      expect(dat.ext).toEqual('.js');
      expect(dat.hash).toEqual(md5('new_file_move.js'));
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["tree", "dir1/test_dir_move"],
      "callback": "callback_tree"
    }));
  });

  // Test the move function
  test('Check <move> Command', done => {
    let received_del_confirm = false;
    let received_file_update = false;
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1/test_dir_move/new_file_move.js');
        expect(msg.data[1]).toEqual('dir1_copy/new_file_copy.js');
        expect(msg.data[2]).toEqual('copy');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual('');
        received_file_update = true;
      } else if (msg.code === 1) {
        expect(msg.msg).toBeDefined();
        expect(msg.msg).toEqual("200 OK");
        expect(msg.callback).toBeDefined();
        expect(msg.callback).toEqual('callback_copy');
        expect(msg.cmd).toBeDefined();
        expect(msg.cmd).toEqual('copy');
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
      "request": ["copy", "dir1/test_dir_move/new_file_move.js", "dir1_copy/new_file_copy.js"],
      "callback": "callback_copy"
    }));
  });

  // Test the move function
  test('Check <move> Command - Directory', done => {
    let received_del_confirm = false;
    let received_file_update = false;
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
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
        expect(msg.data[0]).toEqual('dir1');
        expect(msg.data[1]).toEqual('dir1_folder_copy');
        expect(msg.data[2]).toEqual('copy');
        expect(msg.fp).toBeDefined();
        expect(msg.fp).toEqual('');
        received_file_update = true;
      } else if (msg.code === 1) {
        expect(msg.msg).toBeDefined();
        expect(msg.msg).toEqual("200 OK");
        expect(msg.callback).toBeDefined();
        expect(msg.callback).toEqual('callback_copy');
        expect(msg.cmd).toBeDefined();
        expect(msg.cmd).toEqual('copy');
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
      "request": ["copy", "dir1", "dir1_folder_copy"],
      "callback": "callback_copy"
    }));
  });

  // Test the fingerprint function
  test('Check <fingerprint> Command', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(1);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("200 OK");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_fingerprint');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('fingerprint');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual(md5("This is file 1 (javascript) write - EDITED!"));
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["fingerprint", "dir1/file1.js"],
      "callback": "callback_fingerprint"
    }));
  });



  // Test the fingerprint function
  test('Check <fingerprint> Command - Directory', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(1);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("200 OK");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_fingerprint');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('fingerprint');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual("");
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["fingerprint", "dir1/test_dir"],
      "callback": "callback_fingerprint"
    }));
  });

  // Test the load function
  test('Check <load> Command -> Expect Denial', done => {
    direct = function(data) {
      // Parse Data
      let msg = JSON.parse(data);
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. The requested file is beyond the scope of the allowed directory.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_load_expect_denal');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('load');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data).toEqual('../host.js');
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["load", "utf-8", "../host.js"],
      "callback": "callback_load_expect_denal"
    }));
  });

  afterAll(() => {
    ws_local.close();
    ws_local = null;
  });

});

describe('Testing with \'user2\'', () => {

  beforeAll(done => {
    setTimeout(function() {
      username = 'user2';
      password = 'pass2';
      ws_local = new WebSocket('ws://' + (require('ip').address()) + ':' + 8081);
      direct = null;
      ws_local.on('message', function incoming(data) {
        direct(data);
      });
      done();
    }, 200);
  });

  // Test the key pairing system
  var server_key;
  test('User2: Check Key pairing', done => {
    direct = function(data) {
      let msg = JSON.parse(data);
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(6);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Key Set");
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      server_key = md5(username + '_' + password + '_' + msg.data);
      done();
    };
  });

  // Test the tree function
  test('User2: Check <Tree> Command', done => {
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
      expect(msg.data.length).toEqual(6);
      // Check that file 0 is correct. Assume the rest is correct
      let dat = msg.data[0];
      expect(dat.type).toEqual('file');
      expect(dat.path).toEqual('dir4_moved/file3.txt');
      expect(dat.ext).toEqual('.txt');
      expect(dat.hash).toEqual(md5('dir4_moved/file3.txt'));
      expect(dat.fp).toEqual(md5('This is file 3\n'));
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["tree", "./"],
      "callback": "callback_tree"
    }));
  });

  // Test the save function
  test('Check <save> Command -> Expect Denial', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. Permission denied.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_save_expect_deny');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('save');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual('test_dir/new_file_2.js');
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["save", "utf-8", "test_dir/new_file_2.js", "This is my new file! Expect Deny!"],
      "callback": "callback_save_expect_deny"
    }));
  });

  // Test the delete function
  test('Check <delete> Command -> Expect Denial', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. Permission denied.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_delete_expect_deny');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('delete');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual('./file1.js');
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["delete", "./file1.js"],
      "callback": "callback_delete_expect_deny"
    }));
  });

  // Test the move function
  test('Check <move> Command -> Expect Denial', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. Permission denied.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_move_expect_deny');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('move');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual(['dir4', 'dir4_moved']);
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["move", "dir4", "dir4_moved"],
      "callback": "callback_move_expect_deny"
    }));
  });

  // Test the copy function
  test('Check <copy> Command -> Expect Denial', done => {
    direct = function(data) {
      // Parse Data
      let msg = {};
      try {
        msg = JSON.parse(data);
      } catch (e) {}
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. Permission denied.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_copy_expect_deny');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('copy');
      expect(msg.data).toBeDefined();
      expect(msg.data).toEqual(['dir4', 'dir4_moved']);
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["copy", "dir4", "dir4_moved"],
      "callback": "callback_copy_expect_deny"
    }));
  });

  // Test the load function
  test('Check <load> Command -> Expect Denial (Denied Path)', done => {
    direct = function(data) {
      // Parse Data
      let msg = JSON.parse(data);
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. The requested file is beyond the scope of the allowed directory.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_load_expect_denal');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('load');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data).toEqual('../dir2/file4.txt');
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["load", "utf-8", "../dir2/file4.txt"],
      "callback": "callback_load_expect_denal"
    }));
  });

  // Test the load function
  test('Check <load> Command -> Expect Denial (Invalid Path)', done => {
    direct = function(data) {
      // Parse Data
      let msg = JSON.parse(data);
      // Check that the correct status code and message is present
      expect(msg.code).toBeDefined();
      expect(msg.code).toEqual(8);
      expect(msg.msg).toBeDefined();
      expect(msg.msg).toEqual("Invalid file access. The requested file is beyond the scope of the allowed directory.");
      expect(msg.callback).toBeDefined();
      expect(msg.callback).toEqual('callback_load_expect_denal');
      expect(msg.cmd).toBeDefined();
      expect(msg.cmd).toEqual('load');
      expect(msg.data).toBeDefined();
      expect(msg.data).not.toBeNull();
      expect(msg.data).toEqual('~/test.txt');
      done();
    };
    ws_local.send(JSON.stringify({
      "key": server_key,
      "request": ["load", "utf-8", "~/test.txt"],
      "callback": "callback_load_expect_denal"
    }));
  });


  afterAll(() => {
    ws_local.send('close');
    finish();
  });
});