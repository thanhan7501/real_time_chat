const express = require('express');
const app = express();

const server = require('http').createServer(app);

const io = require('socket.io')(server);

const path = require('path');

const formatMessage = require('./utils/messages');

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

app.get('/', function (req, res, next) {
    res.render('index')
});

app.get('/chat', function (req, res, next) {
    res.render('chat')
});

app.use(express.static(path.join(__dirname + '/public')));

app.set('view engine', 'hbs');
app.set('views', './views');

const admin = "Admin"

//run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        //welcome user 
        socket.emit('message', formatMessage(admin, 'Welcome to the chat'));

        //broadcast when a user connect
        socket.broadcast.to(user.room).emit("message", formatMessage(admin, user.username + ' has joined the chat'));

        //send users and room infor
        io.to(user.room).emit('roomUser', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //listen for chat message
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    //run when a user disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(admin, user.username + ' has left the chat'));
            //send users and room infor
            io.to(user.room).emit('roomUser', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});


var PORT = process.env.PORT || 3000;
server.listen(PORT);
console.debug("Server is running on port: " + PORT);