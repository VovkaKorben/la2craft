// inv_server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Твой порт Vite
        methods: ["GET", "POST"]
    }
});

const port = 49999;
const clients = new Map();

app.use(express.raw({ type: 'application/octet-stream', limit: '1mb' }));

io.on('connection', (socket) => {
    // ХИТРОСТЬ: Забираем GUID прямо из рукопожатия (handshake)
    const guid = socket.handshake.query.guid;
    
    if (guid) {
        clients.set(guid, socket);
        // console.log(`Реакт подключен по GUID: ${guid}`);
    }

    socket.on('disconnect', () => {
        if (guid) {
            clients.delete(guid);
            // console.log(`Реакт отключен: ${guid}`);
        }
    });
});

app.post('/update', (req, res) => {
    const guid = req.query.guid;
    const targetSocket = clients.get(guid);
    
    console.log(`Получены данные для ${guid}: ${req.body.length} байт`);
    
    if (targetSocket && req.body.length > 0) {
        // Отправляем байты в Реакт
        targetSocket.emit('inventory_new', req.body);
        console.log(`Данные успешно пересланы в Реакт для ${guid}`);
    } else if (!targetSocket) {
        console.log(`Ошибка: Реакт с GUID ${guid} не подключен к сокету!`);
    }
    
    res.sendStatus(200);
});

server.listen(port, () => {
    console.log(`Сервер-приемник готов на порту ${port}`);
});