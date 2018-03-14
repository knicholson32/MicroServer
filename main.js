// Import the server
const MicroServer = require('./host');

// Configure the server
let ms = new MicroServer({
  port: 8081, // Port to bind websocket server
  max_clients: 2, // Max number of allowed clients
  key: 'pa88w0r4', // Default interface key
  directory: './files', // Storage location
  log: './.log', // Log location
  ssl: false, // Use SSL to encrypt websocket
  cert: './certificate.pem', // Path to SSL certificate
  key_ssl: './key.pem' // Path to SSL key
});

// Start the server
ms.start();

// Example for how to close the server
setTimeout(function() {
  ms.close();
}, 30000)