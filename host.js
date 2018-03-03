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
var fs = require('fs');

// Create the websocket server and bind it to the configured port
const wss = new WebSocket.Server({ port: config.system.port });

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
console.log("Interface Key: '" + config.system.key + "'");
console.log("Allowing a max of [" + config.system.max_clients + "] clients.");
console.log("Awaiting connections...\n");

// Process a message from the client
function process(ws, message){
  // Decode incoming message
  let results = JSON.parse(message);
  // Set the default return code (successful process)
  let code = 1;
  // Set an empty message as the default message
  let msgOut = "";
  let cmdID = "none";
  // Declare a variable for data
  let data = [];
  // Declare a variable for the callback ID
  let callback = "";

  // Check that the input was a valid json message
  if (results === undefined || results.key === undefined || results.request === undefined || !Array.isArray(results.request) || results.callback === undefined){
    // If not, error
    code = 3;
    msgOut = "Malformed message.";
    data = [message,'{"key":"123123KEY","request":["request_cmd"],"callback":"callback_here"}'];
    cmdID = "err";
  }else{
    
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
