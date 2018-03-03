// ========================================================== //
// config.js :: MicroServer
//
// Configure settings for the MicroServer in this file. All
// user-configurable settings can be edited in the 'system'
// variable below.
// ========================================================== //
let system = {
  port: 8081,           // Port to bind websocket server
  max_clients: 2,       // Max number of allowed clients
  key: 'pa88w0r4',      // Default interface key
  directory: './files', // Storage location
  log: './.log'         // Log location
};
// ========================================================== //

// Import MD5 Hash
var md5 = require('md5');

// Process user input key
// Loop through file args
process.argv.forEach(function (val, index, array) {
  // If there is a key set command, keep note of the next index
  if((val == "-key" || val == "-k" || val == "key") && index + 1 < process.argv.length){
    // Set the new key and return
    system.key = process.argv[index + 1];
    return;
  }
});

// General function for generating a unique id
function getID () {
  return Math.random().toString(36).substr(2, 9);
};
let session_id = getID();

// Module exports
module.exports = {
  id: session_id,
  md5_key: md5(session_id + '-' + system.key),
  createID: getID,
  system: system
};
