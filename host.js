// ============================================== //
// host.js :: MicroServer
//
// Main entry point for MicroServer. View the repo
// at https://github.com/knicholson32/MicroServer
//
// View command list at the Wiki:
// https://github.com/knicholson32/MicroServer/wiki
//
// run with: `node host.js -key [key]`
// ============================================== //

// Imports using require
// Import websocket package
const WebSocket = require('ws');
// Import config file variables
const config = require("./config");
// Import file system packages
var fs = require('file-system');
const path = require('path');
// Import MD5 Hash
var md5 = require('md5');

// Create the websocket server and bind it to the configured port
var wss;
if (config.system.ssl === true) {
  const https = require('https');
  const server = https.createServer({
    port: config.system.port,
    cert: config.system.cert,
    key: config.system.key_ssl
  });
  wss = new WebSocket.Server({
    server
  });
} else {
  wss = new WebSocket.Server({
    port: config.system.port
  });
}

// Set the client count to 0
var client_count = 0;

/* Codes:
 * 0: Refused connection
 * 1: Sucessful process
 * 2: Unknown command
 * 3: Malformed message
 * 4: Invalid key
 * 5: Error
 * 6: Key set
 * 7: File/Directory Update
 */

// Define actions for a new connection
wss.on('connection', function connection(ws) {
  // Process any messages sent from the client
  ws.on('message', function incoming(message) {
    process(ws, message);
  });
  // Remove the client from the count on close
  ws.on('close', function close(e) {
    client_count--;
    console.log("Closed Connection: [" + (config.system.max_clients - client_count) + "] client slots available");
  });
  // Add error handle
  ws.on('error', function err(e) {
    log(e);
  });
  // Process what to do on open
  // Add to the client count
  client_count++;
  // Check to see that there aren't too many clients connected
  if (client_count > config.system.max_clients) {
    // Report denial
    console.log('Client Count Denial');
    // Form response message
    let msg = {
      code: 0,
      msg: "Max number of connections reached. Disconnecting.",
      data: []
    };
    // Send the response message
    ws.send(JSON.stringify(msg));
    // Close denied connection
    ws.close();
  } else {
    // Form response message and include the session id
    let msg = {
      code: 6,
      msg: "Key Set",
      data: config.id
    };
    // Send the response message
    ws.send(JSON.stringify(msg));
    // Report connection
    console.log("Opened Connection: [" + (config.system.max_clients - client_count) + "] client slots available");
  }
});

// Process a message from the client
function process(ws, message) {
  // Decode incoming message
  var results = JSON.parse(message);
  // Set the default return code (successful process)
  var code = 1;
  // Set an empty message as the default message
  var msgOut = "200 OK";
  var cmdID = null;
  // Declare a variable for data
  var data = [];
  // Declare a variable for the callback ID
  var callback = "";

  // Log the message
  log('-> ' + message);

  // Check that the input was a valid json message
  if (results === undefined || results.key === undefined || results.request === undefined || !Array.isArray(results.request) || results.callback === undefined) {
    // If not, error
    code = 3;
    msgOut = "Malformed message.";
    data = [message, '{"key":"123123KEY","request":["request_cmd"],"callback":"callback_here"}'];
    cmdID = "err";
  } else {
    // Grab some variables for easy use
    let key = results.key;
    let request = results.request;
    // Go ahead and set the callback to match the query callback
    callback = results.callback;

    // Check that the key is valid
    if (key != config.md5_key) {
      code = 4;
      msgOut = "Invalid handshake key.";
      console.log("Invalid Key: " + key + "\n");
    } else {
      // Message is valid, and has the correct key. We can continue with the process.
      cmdID = request[0];
      let input_path;
      switch (cmdID) {
        case "tree":
          // ============================== //
          // Produces a recursive file tree //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["tree","./"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":[
          //      {
          //        "type":"file",
          //        "path":"file1.txt",
          //        "ext":".txt",
          //        "md5":"abc123"
          //      },
          //      {
          //        "type":"dir",
          //        "path":"tmp",
          //        "ext":"",
          //        "md5":"123hashabc"
          //      }
          //    ],
          //    "callback":"callback_here",
          //    "cmd":"load"
          // }
          // TODO: Match the wiki to the hash changes above.
          // Resolve the path
          input_path = resolvePath(request[1]);
          // If the path is false, the requested file is outside the scope
          if (input_path === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The requested file is beyond the scope of the allowed directory.";
            data = request[1];
          } else {
            // Ensure that the operated path is a directory
            if (path.parse(input_path).ext != "") {
              // Error: Command argument is a file, not a directory
              code = 5;
              msgOut = "Invalid file access. A '" + cmdID + "' command can only be operated on a directory, while a file was provided.";
              data = request[1];
            } else {
              // Try to access files
              try {
                // Recursively parse every subfolder and file and report the paths.
                fs.recurseSync(input_path, function(filepath, relative, filename) {
                  // Determin the type based on if there is a filename
                  let type = (filename ? 'file' : 'dir');
                  // Parse the relative path
                  let parse = path.parse(relative);
                  // If the file is a system file, skip it
                  if (filename && parse.base.charAt(0) == '.') {
                    return;
                  }
                  // Push the results to be sent back
                  data.push({
                    type: type,
                    path: relative,
                    ext: parse.ext,
                    hash: md5(path.parse(input_path).base)
                  });
                });
              } catch (e) {
                // Catch any errors and report back. Assume the directory does not exist.
                code = 5;
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. This is probably means a directory along the path does not exist.";
                data = request[1];
                log('-> ' + message);
                log(e);
              }
            }
          }
          break;
        case "load":
          // ============================== //
          // Loads a specified file         //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["load","utf-8","file.txt"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":{
          //      "name":"file1.txt",
          //      "size":19,
          //      "enc":"utf-8",
          //      "data":"This is filler text"
          //    },
          //    "callback":"callback_here",
          //    "cmd":"load"
          // }

          // Resolve the path
          input_path = resolvePath(request[2]);
          // If the path is false, the requested file is outside the scope
          if (input_path === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The requested file is beyond the scope of the allowed directory.";
            data = request[2];
          } else {
            // Ensure that the operated path is a file
            if (path.parse(input_path).ext == "") {
              // Error: Command argument is a directory, not a file
              code = 5;
              msgOut = "Invalid file access. A '" + cmdID + "' command can only be operated on a file, while a directory was provided.";
              data = request[2];
            } else {
              // Try to access files
              try {
                // Init some variables
                var contents;
                var encoding = request[1];
                // Encoding specified
                if (encoding != 'none') {
                  // Read with encoding
                  contents = fs.readFileSync(input_path, encoding);
                  encoding = request[1];
                } else {
                  // Read without encoding - buffer
                  contents = fs.readFileSync(input_path);
                }
                // Generate output data
                data = {
                  name: path.parse(input_path).base,
                  size: contents.length,
                  enc: encoding,
                  data: contents
                };
              } catch (e) {
                // Catch any errors and report back. Assume the directory does not exist.
                code = 5;
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. This is probably means a directory along the path does not exist.";
                data = request[2];
                log('-> ' + message);
                log(e);
              }
            }
          }
          break;
        case "save":
          // ============================== //
          // Saves a specified file         //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["save","utf-8","./file1.txt","file update!"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":[],
          //    "callback":"callback_here",
          //    "cmd":"save"
          // }

          // Resolve the path
          input_path = resolvePath(request[2]);
          // If the path is false, the requested file is outside the scope
          if (input_path === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The target file is beyond the scope of the allowed directory.";
            data = request[2];
          } else {
            // Generate path parse of the path given by the user
            let path_parse = path.parse(input_path);
            try {
              // Check if there is a file extension
              if (path_parse.ext != "") {
                // Create all folders leading to the file
                fs.mkdirSync(path_parse.dir);
                try {
                  // Check the encoding type
                  if (request[1] !== undefined && request[1] != 'none' && request[1] != 'append') {
                    // Create an options tree for encoded saving
                    let options = {
                      encoding: request[1]
                    };
                    // Save the file
                    fs.writeFileSync(input_path, request[3], options);
                  } else if (request[1] == 'append') {
                    // Save the file
                    fs.appendFileSync(input_path, request[3]);
                  } else {
                    // Save the file
                    fs.writeFileSync(input_path, request[3]);
                  }
                  wss.broadcast(input_path, request[3], 'update');
                } catch (a) {
                  // Catch any errors and report back. Assume the directory does not exist.
                  if (request[1] != 'none') {
                    msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An issue may have occured with the specified encoding: '" + request[1] + "'";
                  } else {
                    msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while writing the file.";
                  }
                  code = 5;
                  data = request[2];
                  log('-> ' + message);
                  log(a);
                }
              } else {
                // Create the folder
                fs.mkdirSync(input_path);
                wss.broadcast(input_path, '', 'update');
              }
            } catch (e) {
              // Catch any errors and report back. Assume the directory does not exist.
              code = 5;
              msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while creating the directory.";
              data = request[2];
              log('-> ' + message);
              log(e);
            }
          }
          break;
        case "delete":
          // ============================== //
          // Deletes a specified file       //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["delete","./file1.txt"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":[],
          //    "callback":"callback_here",
          //    "cmd":"load"
          // }

          // Resolve the path
          input_path = resolvePath(request[1]);
          // If the path is false, the requested file is outside the scope
          if (input_path === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The target file is beyond the scope of the allowed directory.";
            data = request[1];
          } else {
            // Generate path parse of the path given by the user
            let path_parse = path.parse(input_path);
            // Check if there is a file extension
            if (path_parse.ext != "") {
              try {
                // Delete the file
                fs.unlinkSync(input_path);
                wss.broadcast(input_path, '', 'delete');
              } catch (a) {
                // Catch any errors and report back
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while deleting the file.";
                code = 5;
                data = request[1];
                log('-> ' + message);
                log(a);
              }
            } else {
              try {
                // Delete the folder and contained files
                fs.rmdirSync(input_path);
                wss.broadcast(input_path, '', 'delete');
              } catch (e) {
                // Catch any errors and report back
                code = 5;
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while deleting the directory.";
                data = request[1];
              }
            }
          }
          break;
        case "move":
          // ============================== //
          // Moves a specified file/dir     //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["rename","./file1.txt", "./tmp/file2.txt"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":[],
          //    "callback":"callback_here",
          //    "cmd":"load"
          // }

          // Resolve the paths
          input_path1 = resolvePath(request[1]);
          input_path2 = resolvePath(request[2]);
          // If the path is false, the requested file is outside the scope
          if (input_path1 === false || input_path2 === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The target file is beyond the scope of the allowed directory.";
            data = [request[1], request[2]];
          } else {
            // Get extensions for both file paths
            let ext1 = path.parse(input_path1).ext;
            let ext2 = path.parse(input_path2).ext;
            if ((ext1 == "" && ext2 != "") || (ext1 != "" && ext2 == "")) {
              // Report back this error
              if (ext1 == "") {
                msgOut = "Invalid target. Server was unable to preform a '" + cmdID + "'. A directory cannot be moved to a file.";
              } else {
                msgOut = "Invalid target. Server was unable to preform a '" + cmdID + "'. A file cannot be moved to a directory.";
              }
              code = 5;
              data = [request[1], request[2]];
            } else {
              try {
                // Move the file / folder
                fs.renameSync(input_path1, input_path2);
                //wss.broadcast(['move',input_path1, input_path2]);
                wss.broadcast(input_path1, input_path2, 'move');
              } catch (a) {
                // Catch any errors and report back
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while moving the file. Ensure correct paths.";
                code = 5;
                data = request[1];
                log('-> ' + message);
                log(a);
              }
            }
          }
          break;
        case "copy":
          // ============================== //
          // Copies a specified file        //
          // ============================== //
          // Example: {
          //    "key":"key_here",
          //    "request":["copy","./file1.txt", "./tmp/file2.txt"],
          //    "callback":"callback_here"
          // }
          // -> Resolves: {
          //    "code":1,
          //    "msg":"200 OK",
          //    "data":[],
          //    "callback":"callback_here",
          //    "cmd":"load"
          // }

          // TODO: Support copying directories as well. (#1)

          // Resolve the paths
          input_path1 = resolvePath(request[1]);
          input_path2 = resolvePath(request[2]);
          // If the path is false, the requested file is outside the scope
          if (input_path1 === false || input_path2 === false) {
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The target file is beyond the scope of the allowed directory.";
            data = [request[1], request[2]];
          } else {
            // Get extensions for both file paths
            let ext1 = path.parse(input_path1).ext;
            let ext2 = path.parse(input_path2).ext;
            if (ext1 == "" || ext2 == "") {
              // Catch any errors and report back
              msgOut = "Invalid target. Server was unable to preform a '" + cmdID + "'. A directory cannot be copied.";
              code = 5;
              data = [request[1], request[2]];
            } else {
              try {
                // Copy the file / folder
                fs.copyFileSync(input_path1, input_path2);
                //wss.broadcast(['copy',input_path1, input_path2]);
                wss.broadcast(input_path1, input_path2, 'copy');
              } catch (a) {
                // Catch any errors and report back
                msgOut = "Invalid file access. Server was unable to preform a '" + cmdID + "'. An error occured while copying the file. Ensure correct paths.";
                code = 5;
                data = request[1];
                log('-> ' + message);
                log(a);
              }
            }
          }
          break;
        default:
          code = 2;
          msgOut = "Unknown command: " + cmdID;
          break;
      }
    }
  }

  // Form the return message
  let return_msg = {
    code: code,
    msg: msgOut,
    data: data,
    callback: callback,
    cmd: cmdID
  };
  // Send the return message
  ws.send(JSON.stringify(return_msg));
  log("<- [" + code + "] (" + cmdID + ") '" + msgOut + "'");
}

// Broadcast function to alert all connections that there has been a file change
// of some sort.
wss.broadcast = function broadcast(path, data, type, ws) {
  // Loop through all clients
  wss.clients.forEach(function each(client) {
    // Check if the client is active
    if (client.readyState === WebSocket.OPEN) { // && client !== ws) {
      // Generate a message
      let return_msg = {
        code: 7,
        msg: "directory/file update",
        data: [path, data, type],
        callback: "file_tree_refresh",
        cmd: "file_tree_refresh"
      };
      // Send the return message
      client.send(JSON.stringify(return_msg));
    }
  });
  log('Broadcast file/dir update:' + data);
};

// Override logging to print to console and log file
var old_c = console.log;
console.log = function(e) {
  log(e);
  old_c(e);
}

// Log file print
function log(e, date = true) {
  if (date === false) {
    try {
      fs.appendFileSync(config.system.log, '' + e + '\n');
    } catch (e) {
      old_c(e);
    }
  } else {
    let d = new Date();
    dateString = d.toTimeString().split(' ')[0];
    try {
      fs.appendFileSync(config.system.log, dateString + '  ' + e + '\n');
    } catch (e) {
      old_c(e);
    }
  }
}

// Resolve a path relative to the file directory. If a file path is resolved that
// is outside the scope of the file directory, false is returned.
function resolvePath(input_path) {
  // Resolves the input path with the file directory at the start:
  // IE: ./files/ input/files/here
  let conv = path.resolve(config.system.directory, path.normalize(input_path));
  // Resolves the file directory in terms of the system
  let base = path.resolve(config.system.directory);
  // Compares the two paths. If '../' or '..\\' is found, it can be determined that
  // the user is trying to access something outside the allowed folder. Deny it.
  let overlap = path.relative(base, conv);
  if (!overlap.includes('../') && !overlap.includes('..\\')) {
    return path.join(config.system.directory, overlap);
  } else {
    return false;
  }
}

// Module exports
module.exports = {
  process: process,
  resolvePath: resolvePath,
  log: log,
  wss: wss
};

// ============================================== //

// Init log file
log('\n==============================================', false);
log(Date(), false);
log('==============================================\n', false);


// Report details
console.log("Websocket active on port: " + config.system.port);
console.log("Interface Hash: '" + config.md5_key + "'");
console.log("Allowing a max of [" + config.system.max_clients + "] clients.");
console.log("Type ctrl-C to exit.");
console.log("Awaiting connections...");