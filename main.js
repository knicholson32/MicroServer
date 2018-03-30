const MicroServer = require('./host');

let users = [{
  name: 'user1',
  pass: 'pass1',
  folder: './',
  permission: 'read-write'
}];

let ms = new MicroServer({
  port: 8081, // Port to bind websocket server
  max_clients: 2, // Max number of allowed clients
  directory: './files', // Storage location
  log: './.log', // Log location
  ssl: false, // Use SSL to encrypt websocket (wss instead of ws)
  cert: './test/keys/certs/server/my-server.crt.pem', // Path to SSL certificate
  key_ssl: './test/keys/certs/server/my-server.key.pem', // Path to SSL key
  users: users, // User description array, as shown above
  verbose: true, // Tells server to print all message interactions. Headless must be false.
  headless: false, // Setting true will not print anything to the console
  // console: console // Can override console object if output should be routed
  //                  // somewhere else
});

ms.start();