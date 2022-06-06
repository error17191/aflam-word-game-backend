const http = require('http');
const {Server} = require("socket.io");
const {v4: uuidv4} = require('uuid');

const server = http.createServer();

const io = new Server(server, {
    cors: {
        origin: "*",
        allowedHeaders: ["*"],
    },
});

let rooms = {};


io.on('connection', (socket) => {
    socket.on('create-room', data => {
        let roomUUID = uuidv4();
        rooms[roomUUID] = {
            players: [{
                id: socket.id,
                name: data.name,
            }]
        };
        socket.emit('room-created', {
            roomUUID,
            playerID: socket.id
        });
    });

    socket.on('room-exists', uuid => {
        socket.emit('room-exists', {
            exists: !!rooms[uuid]
        });
    });

    socket.on('join-room', data => {
        if (!rooms[data.roomUUID]) {
            socket.emit('room-not-found');
            return;
        }
        let playerUUID = uuidv4();
        rooms[data.roomUUID].players.push({
            id: socket.id,
            name: data.name,
        });

        io.emit('update-players', rooms[data.roomUUID].players);
    });
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});
