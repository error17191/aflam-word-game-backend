const http = require('http');
const https = require('https');
const express = require('express');
const {Server} = require("socket.io");
const {v4: uuidv4} = require('uuid');
const {readFileSync} = require("fs");
const env = require('./env');
const {isSecure} = require("./env");
const movies = require('./movies');

const app = express();
const server = createServer(app);

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

    socket.on('player-ready', data => {
        console.log('player-ready');
        if (!rooms[data.roomUUID]) {
            console.log('player-ready..Not found');
            socket.emit('room-not-found');
            return;
        }
        let startGame = true;
        for (let player of rooms[data.roomUUID].players) {
            if (player.id == data.playerID) {
                player.ready = true;
            }
            startGame = startGame && player.ready;
        }

        if(startGame){
            io.emit('start-game', getRandomMovie());
        }
    });

    socket.on('win', data => {
        let winner;
        for(let player of rooms[data.roomUUID].players){
            if(player.id == data.playerID){
                winner = player;
            }
        }
        console.log('winner ' + winner.name);
        io.emit('win', winner);
    });
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});


function createServer(app) {
    if (!isSecure) {
        return http.createServer(app);
    }

    return https.createServer({
        key: readFileSync(env.sslKey),
        cert: readFileSync(env.sslPem)
    }, app);
}

let arabicAlphabet = [
    ['ا', 'أ', 'ئ', 'ء', 'ؤ', 'آ', 'إ'],
    'ب',
    ['ت', 'ة'],
    'ث',
    'ج',
    'ح',
    'خ',
    'د',
    'ذ',
    'ر',
    'ز',
    'س',
    'ش',
    'ص',
    'ض',
    'ط',
    'ظ',
    'ع',
    'غ',
    'ف',
    'ق',
    'ك',
    'ل',
    'م',
    'ن',
    'ه',
    'و',
    ['ى', 'ي'],
];

function getRandomMovie(){
    let movie = movies[Math.floor(Math.random() * (movies.length - 1))].name
    for(let char of movie.split('')){
        if(char == ' '){
            continue;
        }
        let isCharFound = false;
        for (let letters of arabicAlphabet){
            if(Array.isArray(letters) ? letters.includes(char) : letters == char){
                isCharFound = true;
                break;
            }
        }

        if(!isCharFound){
            return getRandomMovie();
        }
    }

    return  movie;
}
