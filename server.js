// Create Next.js application
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const next_app = next({dev})

// Get standard requests handler and run preparing
const handle = next_app.getRequestHandler();
const next_app_prepare = next_app.prepare();

// Create http server
const express = require('express');
const http = require('http');

const express_app = express();
const server = http.createServer(express_app);

// Connect database
const path = require('path');
const NeDB = require('nedb');

const db = new NeDB({filename: path.resolve(__dirname, 'db/main.db'), autoload: true});

// Create socket.io server
const socketIOServer = require("socket.io").Server;
const socketServer = new socketIOServer(server);

// Setup callbacks
express_app.get('*', (req, res) => {
  return handle(req, res)
})

socketServer.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('Hello', (...args) => {
    console.log(`Hello with ${args.flat().join(', ')}`);
  })
});

next_app_prepare.then(() => {
    server.listen(3000, (err) => {
      if (err)
        throw err;
      console.log('> Ready on port 3000')
    })

    //socketServer.listen(3001);
  })
  .catch((ex) => {
    console.error(ex.stack)
    process.exit(1)
  })
