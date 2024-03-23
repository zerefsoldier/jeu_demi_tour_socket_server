const express = require('express');
const https = require('https');
const socketIO = require('socket.io');

const app = express();
const fs = require("fs");
const cors = require('cors')
const server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/marc-chantebel.info/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/marc-chantebel.info/fullchain.pem')
}, (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    response.setHeader('Access-Control-Allow-Headers', '*');

    response.end();
});
const io = socketIO(server, { cors: true, origin: true, allowEIO3: true });

app.use(cors);

// Variable userDetails pour stocker les détails des utilisateurs
const rooms = {};

// Gestionnaire de connexion Socket.io
io.on('connection', (socket) => {

    console.log(socket.id + ' s\'est connecté');

    socket.on("get_rooms", () => {
        const keys = Object.keys(rooms);
        const datas = keys.map(key => {
            return {id: key, playlist: rooms[key].playlist, title: rooms[key].playlistTitle}; 
        });

        socket.emit("get_rooms", JSON.stringify(datas));
    });

    socket.on('create_room', (params) => {
        const json = JSON.parse(params);
        rooms[json.room] = {playlist: json.playlist, playlistTitle: json.playlistTitle, users: [{sId : socket.id, username: json.username}]};
        socket.join(json.room);

        socket.broadcast.emit("roomCreated", params);
    });

    socket.on('join_room', (params) => {
        const json = JSON.parse(params);

        socket.join(json.room);
        socket.emit("users_room_list", JSON.stringify(rooms[room.name].users));

        rooms[json.room].users.push({sId: socket.id, username: json.username});
        io.to(json.room).broadcast.emit("join_room", json.username);
    });

    socket.on("game_start", room => {
        io.to(room).broadcast.emit("game_start");
    });
});

const PORT = process.env.PORT || 8181;
server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
