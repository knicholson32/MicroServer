[![CircleCI branch](https://img.shields.io/circleci/project/github/knicholson32/MicroServer/master.svg)](https://circleci.com/gh/knicholson32/MicroServer)


# MicroServer
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

## Running
```shell
node host.js -key [my_password_here]
```
