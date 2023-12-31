const default_sheet = (name) => {return {
  name,
  styles: {
    "default": {
      bgColor: "rgb(227, 203, 123)",
      labelColor: "black",
      textColor: "black",
    }
  },
  table: [
    {
      label: "to do",
      cards: [
        {label: "normal", style: "default", text: "sample normal task"}
      ]
    },
    {
      label: "done",
      cards: []
    },
    {
      label: "in work",
      cards: [
        {label: "no care", style: "default", text: "sample easy task"},
        {label: "important", style: "default", text: "sample important task"}
      ]
    },
  ]
}}

const dev = !(typeof process.env.NODE_ENV === 'string' || process.env.NODE_ENV instanceof String) || !process.env.NODE_ENV.startsWith('production');
console.log(dev ? "Using development mode" : "Using production mode");

const log = (...args) => {
  if (dev) console.log(...args);
}

const error = (...args) => {
  if (dev) console.error(...args);
}

(async () => {
  // Some utility
  const path = require('path');
  const { exit } = require('process');

  // Create Next.js application
  const next = require('next');
  const next_app = next({dev})

  // Get standard requests handler and run preparing
  const handle = next_app.getRequestHandler();
  const next_app_prepare = next_app.prepare();

  // Create http server
  const express = require('express');
  const http = require('http');

  const express_app = express();
  const server = http.createServer(express_app);

  express_app.use(require('cookie-parser')());
  express_app.use(require('cors')({credentials: true, origin: true}));

  // Connect database
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');
  const bcrypt = require('bcrypt');

  const db = new Low(new JSONFile(path.resolve(__dirname, 'db/main.db')), {sheets: {}, users: {}});
  db.was_change = false;
  
  function writeDB() {
    if (db.was_change) {
      db.was_change = false;
      db.write()
        .then(() => setTimeout(writeDB, 30 * 1000))
        .catch(() => setTimeout(writeDB, 5 * 1000))
    } else setTimeout(writeDB, 30 * 1000);
  }

  // We need to garant loaded database
  await db.read();
  setTimeout(writeDB, 30 * 1000);

  /* Account creation function */
  function createAccount(username, password) {
    return new Promise((resolve) => {
      if (db.data.users[username] !== undefined) {
        resolve(false);
      } else {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            resolve(false);
          } else {
            db.data.users[username] = {
              username: username,
              password: hash,
              sheets: []
            };
            db.was_change = true;

            resolve(true);
          }
        })
      }
    })
  }

  /* Account deleting function */
  function deleteAccount(username) {
    let user = db.data.users[username];

    if (user !== undefined) {
      return false;
    } else {
      if (Array.isArray(user.sheets)) [...user.sheets].forEach(val => {
          try {
            deleteUserFromSheet(val, username, true);
          } catch (_err) {}
        })

      delete db.data.users[username];

      db.was_change = true;
    }
  }

  /* Account login verification function */
  function loginAccount(username, password) {
    return new Promise(resolve => {
      let user = db.data.users[username];

      if (user === undefined) {
        resolve(false);
      } else {
        bcrypt.compare(password, user.hash, res => resolve(res));
      }
    })
  }

  /* Sheet creation function */
  function createSheet(name) {
    if (db.data.sheets[name] !== undefined) {
      return false;
    } else {
      /* Adding default "example" content */
      db.data.sheets[name] = default_sheet(name)  ;
      db.was_change = true;
      
      return true;
    }
  }

  /* Sheet deleting */
  function deleteSheet(name) {
    let sheet = db.data.sheets[name];

    if (sheet === undefined) {
      return false;
    } else {
      if (Array.isArray(sheet.users)) sheet.users.forEach(val => deleteUserFromSheet(name, val, false));

      delete db.data.sheets[name];
      db.was_change = true;
    }
  }

  /* User adding for sheet access */
  function addUserToSheet(name, username) {
    let sheet = db.data.sheets[name];
    let user = db.data.users[username];

    if (sheet === undefined || user === undefined) {
      return false;
    } else {
      if (!Array.isArray(sheet.users)) sheet.users = []
      if (sheet.users.findIndex(val => val === username) === -1) sheet.users.push(username);

      if (!Array.isArray(user.sheets)) user.sheets = []
      if (user.sheets.findIndex(val => val === name) === -1) user.sheets.push(name);

      return true;
    }
  }

  /* User removing from sheet access */
  function deleteUserFromSheet(name, username, tableRemove=true) {
    let sheet = db.data.sheets[name];
    let user = db.data.users[username];

    if (sheet === undefined || user === undefined) {
      return false;
    } else {
      /* Remove from user */
      {
        let arr = db.data.users[username].sheets;

        if (Array.isArray(arr)) {
          let ind = arr.findIndex(val => val == name);
          
          if (ind !== -1) arr.splice(ind, 1);
        }
      }

      /* Remove from sheet */
      {
        let arr = db.data.sheets[name].users;

        if (Array.isArray(arr)) {
          let ind = arr.findIndex(val => val == username);
          
          if (ind !== -1) arr.splice(ind, 1);

          /* Delete sheet without users */
          if (tableRemove && arr.length === 0) deleteSheet(name);
        }
      }

      return true;
    }
  }

  /* Sheet access validation */
  function accessSheet(name, username) {
    let sheet = db.data.sheets[name];
    let user = db.data.users[username];

    if (sheet === undefined || !Array.isArray(sheet.users) || sheet.users.findIndex(val => val === username) === -1 ||
        user === undefined || !Array.isArray(user.sheets) || user.sheets.findIndex(val => val === name) === -1) {
      return false;
    } else {
      return true;
    }
  }

  /* Sheet modifications functions */
  const sheet_modify = {
    move_card: function(sheet, column, new_column, ind, new_ind) {
      sheet = db.data.sheets[sheet];
      
      /* Validate objects */
      if (sheet === undefined) return false;
      if (sheet.table[column] === undefined || sheet.table[new_column] === undefined) return false;
      
      /* Validate indices */
      if (ind >= sheet.table[column].cards.length) return false;
      if (new_ind > sheet.table[new_column].cards.length - (column === new_column)) return false;

      /* Permute */
      sheet.table[new_column].cards.splice(new_ind, 0, ...sheet.table[column].cards.splice(ind, 1));
      db.was_change = true;

      return true;
    },
    move_column: function(sheet, ind, new_ind) {
      sheet = db.data.sheets[sheet];

      /* Validate object */
      if (sheet === undefined) return false;

      /* Validate indices */
      if (ind >= sheet.table.length || new_ind >= sheet.table.length) return false;

      /* Permute */
      sheet.table.splice(new_ind, 0, ...sheet.table.splice(ind, 1));
      db.was_change = true;

      return true;
    },
    add_card: function(sheet, column, label, style, text) {
      sheet = db.data.sheets[sheet];

      /* Validate object */
      if (sheet === undefined) return false;
      if (sheet.table[column] === undefined) return false;
      if (sheet.styles[style] === undefined) return false;

      /* Add card */
      sheet.table[column].cards.push({label, style, text});
      db.was_change = true;

      return true;
    },
    delete_card: function(sheet, column, ind) {
      sheet = db.data.sheets[sheet];

      /* Validate object */
      if (sheet === undefined) return false;
      if (sheet.table[column] === undefined) return false;
      
      /* Validate index */
      if (ind >= sheet.table[column].cards.length) return false;

      /* Remove card */
      sheet.table[column].cards.splice(ind, 1);
      db.was_change = true;

      return true;
    },
    edit_card: function(sheet, column, ind, label, style, text) {
      sheet = db.data.sheets[sheet];

      /* Validate object */
      if (sheet === undefined) return false;
      if (sheet.columns[column] === undefined) return false;
      if (sheet.styles[style] === undefined) return false;

      /* Validate card */
      const card = sheet.table[column].cards[ind];
      if (card === undefined) return false;

      card.label = label;
      card.style = style;
      card.text = text;
      db.was_change = true;

      return true;
    },
    add_edit_style: function(sheet, name, obj) {
      sheet = db.data.sheets[sheet];

      /* Validate object */
      if (sheet === undefined) return false;

      sheet.styles[name] = obj;
      db.was_change = true;

      return true;
    }
  }

  // Create socket.io server
  const socketIOServer = require("socket.io").Server;
  const socketServer = new socketIOServer(server, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  // Setup callbacks
  express_app.post('/api/account/signup', (req, res) => {
    function success() {
      log('signup success');
      res.sendStatus(200);
    }

    function fail() {
      log('signup fail');
      res.sendStatus(401);
    }

    let data = "";
    
    req.on('data', (chunk) => data += chunk)
      .on('end', () => {
        try {
          let obj = JSON.parse(data);
          if (obj.username === undefined || obj.password === undefined) throw "Incorrect object";

          createAccount(obj.username, obj.password)
            .then(val => {
              if (val) success()
              else fail()
            })
            .catch(err => fail())
        } catch (err) {
          fail();
        }
      })
      .on('error', (err) => fail());
  })

  // Setup callbacks
  express_app.post('/api/account/signin', (req, res) => {
    function success() {
      log('signin success');
      res.sendStatus(200);
    }

    function fail() {
      log('signin fail');
      res.sendStatus(401);
    }
    
    let data = "";

    req.on('data', (chunk) => data += chunk)
      .on('end', () => {
        try {
          let obj = JSON.parse(data);
          if (obj.username === undefined || obj.password === undefined) throw "Incorrect object";

          loginAccount(obj.username, obj.password)
            .then(val => {
              if (val) success()
              else fail()
            })
            .catch(err => fail())
        } catch (err) {
          fail();
        }
      })
      .on('error', (err) => fail());
  })

  express_app.post('/api/sheets/create', (req, res) => {
    function success() {
      log('sheet creeation success');
      res.sendStatus(200);
    }

    function fail() {
      log('sheet creeation fail');
      res.sendStatus(401);
    }
    
    let data = "";

    req.on('data', (chunk) => data += chunk)
      .on('end', () => {
        try {
          let obj = JSON.parse(data);
          if (obj.username === undefined || obj.name === undefined) throw "Incorrect object";

          if (createSheet(obj.name) && addUserToSheet(obj.name, obj.username)) success()
          else fail()
        } catch (err) {
          fail();
        }
      })
      .on('error', (err) => fail());
  })

  express_app.get('/api/sheets/list', (req, res) => {
    let username = req.cookies.username;
    let user = db.data.users[username];

    if (user === undefined) {
      res.sendStatus(401);
    } else {
      res.writeHead(200);
      res.write(JSON.stringify(user.sheets));
      res.end();
    }
  })

  express_app.get('/api/sheets/*', (req, res) => {
    let path = req.url.split('/');
    let name = path[path.length - 1];

    if (accessSheet(path[path.length - 1], req.cookies.username)) {
      res.send(JSON.stringify(db.data.sheets[name]));
    } else {
      res.sendStatus(403);
    }
  })
  
  express_app.get('*', (req, res) => {
    return handle(req, res)
  })
                          
  socketServer.on('connection', (socket) => {
    socket.path = socket.handshake.query.path;
    socket.username = socket.handshake.query.username;

    if (socket.path === undefined || socket.username === undefined || !accessSheet(socket.path, socket.username)) {
      socket.disconnect(true);
      return;
    }

    socket.sendSheet = () => socket.emit('sheet', db.data.sheets[socket.path]);
    socket.sendSheet();

    if (socket.recovered) {
    } else {
      socket.join(socket.path);
      socket
        .on('move card inside', (column, ind, new_ind) => {
          if (sheet_modify.move_card(socket.path, column, column, ind, new_ind)) {
            log(`moved card in ${socket.path}: from (${column}; ${ind}) to (${column}; ${new_ind})`);

            socket.to(socket.path).emit('move card inside', column, ind, new_ind);
            
          } else {
            socket.sendSheet();
          }
        })
        .on('move card between', (column, new_column, ind, new_ind) => {
          if (sheet_modify.move_card(socket.path, column, new_column, ind, new_ind)) {
            log(`moved card in ${socket.path}: from (${column}; ${ind}) to (${new_column}; ${new_ind})`);

            socket.to(socket.path).emit('move card between', column, new_column, ind, new_ind);
          } else {
            socket.sendSheet();
          }
        })
        .on('move column', (ind, new_ind) => {
          if (sheet_modify.move_column(socket.path, ind, new_ind)) {
            log(`moved column in ${socket.path}: from ${ind} to ${new_ind}`);

            socket.to(socket.path).emit('move column', ind, new_ind);
          } else {
            socket.sendSheet();
          }
        })
        .on('add card', (column, label, style, text) => {
          if (sheet_modify.add_card(socket.path, column, label, style, text)) {
            log(`added card in ${socket.path}: to ${column} named ${label}, styled ${style} and with length ${text.length}`);

            socket.to(socket.path).emit('add card', column, label, style, text);
          } else {
            socket.sendSheet();
          }
        })
        .on('add user', (username, callback) => {
          if (addUserToSheet(socket.path, username)) {
            log(`added user in ${socket.path}: ${username}`);

            if (typeof callback === 'function') callback(true);
            socket.to(socket.path).emit('add user', username);
          } else if (typeof callback === 'function') callback(false);
        })
        .on('remove user', (username, callback) => {
          if (deleteUserFromSheet(socket.path, username)) {
            log(`removed user from ${socket.path}: ${username}`);

            if (typeof callback === 'function') callback(true);
            socket.to(socket.path).emit('remove user', username);
          } else if (typeof callback === 'function') callback(false);
        })
        .on('delete card', (column, ind) => {
          if (sheet_modify.delete_card(socket.path, column, ind)) {
            log(`deleted card in ${socket.path}: (${column}: ${ind})`);

            socket.to(socket.path).emit('delete card', column, ind);
          } else {
            socket.sendSheet();
          }
        })
        .on('add style', (name, obj) => {
          if (sheet_modify.add_edit_style(socket.path, name, obj)) {
            log(`updated style in ${socket.path}: ${name}`);

            socket.to(socket.path).emit('add style', name, obj);
          } else {
            socket.sendSheet();
          }
        })
    }
  });

  next_app_prepare.then(() => {
      server.listen(3000, (err) => {
        if (err)
          throw err;
        log('> Ready on port 3000')
      })

      //socketServer.listen(3001);
    })
    .catch((ex) => {
      error(ex.stack)
      process.exit(1)
  })
})()
