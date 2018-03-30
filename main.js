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
  ssl: true, // Use SSL to encrypt websocket
  cert: './keys/cert.pem', // Path to SSL certificate
  key_ssl: './keys/key.pem', // Path to SSL key
  users: users
});

ms.start();