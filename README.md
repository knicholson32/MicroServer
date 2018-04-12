# MicroServer
[![Release](https://img.shields.io/github/release/knicholson32/MicroServer.svg)](https://github.com/knicholson32/MicroServer)
[![CircleCI branch](https://img.shields.io/circleci/project/github/knicholson32/MicroServer/master.svg)](https://circleci.com/gh/knicholson32/MicroServer)
[![BSD3 License](http://img.shields.io/badge/license-MIT-brightgreen.svg?longCache=true&style=flat)](https://tldrlegal.com/license/mit-license)

JavaScript WebSocket file server for the [Micro Editor](https://github.com/npnicholson/Micro) and other online systems.

[View the Wiki](https://github.com/knicholson32/MicroServer/wiki) for detailed usage and configuration information.

## Installing
This server requires [npm](https://www.npmjs.com/) (and by extension, [node.js](https://nodejs.org/en/)). Ensure these are installed:
```shell
npm -v
node -v
```
- Clone the repository
```shell
git clone https://github.com/knicholson32/MicroServer.git
```
- Move to inside the created folder
```shell
cd MicroServer
```
- Initialize packages
```shell
npm i
```

## Create MicroServer
```JavaScript
/* main.js */
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
  ssl: false, // Use SSL to encrypt websocket
  users: users
});

ms.start();
```

## Running
```shell
node main.js
```
