const MicroServer = require('../host');

let users = [{
    name: 'user1',
    pass: 'pass1',
    folder: './',
    permission: 'read-write'
  },
  {
    name: 'user2',
    pass: 'pass2',
    folder: 'dir1',
    permission: 'read'
  },
  {
    name: 'user3',
    pass: 'pass3',
    folder: 'sub',
    permission: 'read-write'
  },
];

let ms = new MicroServer({
  port: 8081, // Port to bind websocket server
  max_clients: 1, // Max number of allowed clients
  directory: './files', // Storage location
  log: './.log', // Log location
  ssl: true, // Use SSL to encrypt websocket
  cert: './test/keys/certs/server/my-server.crt.pem', // Path to SSL certificate
  key_ssl: './test/keys/certs/server/my-server.key.pem', // Path to SSL key
  users: users
});

ms.enableClose();
ms.start();