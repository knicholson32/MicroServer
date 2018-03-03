// ============================================== //
// host.js :: MicroServer
//
// Main entry point for MicroServer. View the repo
// at https://github.com/knicholson32/MicroServer
//
// run with: node host.js -key [key]
// ============================================== //

// Imports using require
// Import websocket package
const WebSocket = require('ws');
// Import config file variables
const config = require("./config");
// Import file system packages
var fs = require('file-system');
const path = require('path');

// Create the websocket server and bind it to the configured port
const wss = new WebSocket.Server({
  port: config.system.port
});

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
 */

// Define actions for a new connection
wss.on('connection', function connection(ws) {
  // Process any messages sent from the client
  ws.on('message', function incoming(message) {
    process(ws, message);
  });
  // Remove the client from the count on close
  ws.on('close', function close(e) {
    console.log("Closed Connection");
    client_count --;
  });
  // Process what to do on open
  // Check to see that there aren't too many clients connected
  if (client_count + 1 > config.system.max_clients){
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
  }else{
    // Form response message and include the session id
    let msg = {
      code: 6,
      msg: "Key Set",
      data: config.id
    };
    // Send the response message
    ws.send(JSON.stringify(msg));
    // Report connection
    console.log('Opened Connection');
    // Add to the client count
    client_count ++;
  }
});

// Report details
console.log("Websocket active on port: " + config.system.port);
console.log("Interface Hash: '" + config.md5_key + "'");
console.log("Allowing a max of [" + config.system.max_clients + "] clients.");
console.log("Awaiting connections...\n");

// Process a message from the client
function process(ws, message){
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

  // Check that the input was a valid json message
  if (results === undefined || results.key === undefined || results.request === undefined || !Array.isArray(results.request) || results.callback === undefined){
    // If not, error
    code = 3;
    msgOut = "Malformed message.";
    data = [message,'{"key":"123123KEY","request":["request_cmd"],"callback":"callback_here"}'];
    cmdID = "err";
  }else{
    // Grab some variables for easy use
    let key = results.key;
    let request = results.request;
    // Go ahead and set the callback to match the query callback
    callback = results.callback;

    // Check that the key is valid
    if (key != config.md5_key && false){
      code = 4;
      msgOut = "Invalid handshake key.";
      console.log("Invalid Key: " + key + "\n");
    }else{
      // Message is valid, and has the correct key. We can continue with the process.
      cmdID = request[0];
      let input_path;
      switch (cmdID) {
        case "tree":
          // Resolve the path
          input_path = resolvePath(request[1]);
          // If the path is false, the requested file is outside the scope
          if(input_path === false){
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The requested file is beyond the scope of the allowed directory.";
            data = request[1];
          }else{
            // Ensure that the operated path is a directory
            if(path.parse(input_path).ext != ""){
              // Error: Command argument is a file, not a directory
              code = 5;
              msgOut = "Invalid file access. A '"+cmdID+"' command can only be operated on a directory, while a file was provided.";
              data = request[1];
            }else{
              // Try to access files
              try{
                // Recursively parse every subfolder and file and report the paths.
                fs.recurseSync(input_path, function(filepath, relative, filename) {
                  // Determin the type based on if there is a filename
                  let type = (filename?'file':'dir');
                  // Parse the relative path
                  let parse = path.parse(relative);
                  // If the file is a system file, skip it
                  if(filename && parse.base.charAt(0) == '.'){
                    return;
                  }
                  // Push the results to be sent back
                  data.push({type:type, path:relative, ext:parse.ext});
                });
              }catch(e){
                // Catch any errors and report back. Assume the directory does not exist.
                code = 5;
                msgOut = "Invalid file access. Server was unable to preform an '"+cmdID+"'. This is probably means a directory along the path does not exist.";
                data = request[1];
                console.log(cmdID + " error: ");
                console.log(e);
              }
            }
          }
          break;
        case "load":
          // Resolve the path
          input_path = resolvePath(request[1]);
          // If the path is false, the requested file is outside the scope
          if(input_path === false){
            // Error: File is outside the allowed directory
            code = 5;
            msgOut = "Invalid file access. The requested file is beyond the scope of the allowed directory.";
            data = request[1];
          }else{
            // Ensure that the operated path is a file
            if(path.parse(input_path).ext == ""){
              // Error: Command argument is a directory, not a file
              code = 5;
              msgOut = "Invalid file access. A '"+cmdID+"' command can only be operated on a file, while a directory was provided.";
              data = request[1];
            }else{
              // Try to access files
              try{
                // Init some variables
                var contents;
                var encoding = 'none';
                // Encoding specified
                if(request.length > 2){
                  // Read with encoding
                  contents = fs.readFileSync(input_path, request[2]);
                  encoding = request[2];
                }else{
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
              }catch(e){
                // Catch any errors and report back. Assume the directory does not exist.
                code = 5;
                msgOut = "Invalid file access. Server was unable to preform an '"+cmdID+"'. This is probably means a directory along the path does not exist.";
                data = request[1];
                console.log(cmdID + " error: ");
                console.log(e);
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

  let return_msg = {
    code: code,
    msg: msgOut,
    data: data,
    callback: callback,
    cmd: cmdID
  };
  ws.send(JSON.stringify(return_msg));
}

// Resolve a path relative to the file directory. If a file path is resolved that
// is outside the scope of the file directory, false is returned.
function resolvePath(input_path){
  // Resolves the input path with the file directory at the start:
  // IE: ./files/ input/files/here
  let conv = path.resolve(config.system.directory, path.normalize(input_path));
  // Resolves the file directory in terms of the system
  let base = path.resolve(config.system.directory);
  // Compares the two paths. If '../' or '..\\' is found, it can be determined that
  // the user is trying to access something outside the allowed folder. Deny it.
  let overlap = path.relative(base,conv);
  if(!overlap.includes('../') && !overlap.includes('..\\')){
    return path.join(config.system.directory, overlap);
  }else{
    return false;
  }
}
