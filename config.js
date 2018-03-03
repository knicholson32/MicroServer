// ============================================== //
// config.js :: MicroServer
//
// Configure settings for the MicroServer in this
// file. All user-configurable settings can be
// edited in the 'system' variable below.
// ============================================== //
let system = {
  port: 8081,     //  Port to bind websocket server
  max_clients: 1, //  Max number of allowed clients
  key: 'pa88w0r4' //  Default interface key
};
// ============================================== //

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
  return '_' + Math.random().toString(36).substr(2, 9);
};

// Module exports
module.exports = {
  id: getID(),
  createID: getID,
  system: system
};
