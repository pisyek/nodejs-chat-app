const path = require('path');
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socket(server);
const port = process.env.PORT || 3000;

const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit('message', generateMessage('System', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage(user.username, `${user.username} has joined!`));
  
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
  });
  
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Cannot post profane message!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', generateMessage('System', `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    var url = `https://google.com/maps?q=${location.latitude},${location.longitude}`;
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url));
    callback();
  });
});

server.listen(port, () => {
  console.log('App listening to port ' + port);
});