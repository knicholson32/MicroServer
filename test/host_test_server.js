const MicroServer = require('../host');

let ms = new MicroServer({
  port: 8081, // Port to bind websocket server
  max_clients: 1, // Max number of allowed clients
  key: 'test_key', // Default interface key
  directory: './files', // Storage location
  log: './.log', // Log location
  ssl: false, // Use SSL to encrypt websocket
});

ms.enableClose();
ms.start();