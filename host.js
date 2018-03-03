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
    process(message);
  });
  // Remove the client from the count on close
  ws.on('close', function close(e) {
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
    console.log('Open');
    // Add to the client count
    client_count ++;
  }
});

// Report details
console.log("Websocket active on port: " + config.system.port + ".");
console.log("Allowing a max of [" + config.system.max_clients + "] clients.");
console.log("Awaiting connections...");

// Process a message from the client
function process(message){
  let msg = JSON.parse(message);
  console.log(msg);
}
