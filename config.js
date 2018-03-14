// ========================================================== //
// config.js :: MicroServer
//
// Configure settings for the MicroServer in this file. All
// user-configurable settings can be edited in the 'system'
// variable below.
// ========================================================== //
/*let system = {
  port: 8081, // Port to bind websocket server
  max_clients: 2, // Max number of allowed clients
  key: 'pa88w0r4', // Default interface key
  directory: './files', // Storage location
  log: './.log', // Log location
  ssl: false, // Use SSL to encrypt websocket
  cert: './certificate.pem', // Path to SSL certificate
  key_ssl: './key.pem' // Path to SSL key
};*/
// ========================================================== //


// Process user input key
// Loop through file args
/*process.argv.forEach(function(val, index, array) {
  // If there is a key set command, keep note of the next index
  if ((val == "-key" || val == "-k" || val == "key") && index + 1 < process.argv.length) {
    // Set the new key and return
    system.key = process.argv[index + 1];
    return;
  }
});

// Loop through file args
system.testing = false;
process.argv.forEach(function(val, index, array) {
  // If there is a key set command, keep note of the next index
  if (val == "-test") {
    // Set the new key and return
    system.testing = true;
    system.ssl = false;
    return;
  }
});*/

// Module exports
//module.exports = system;