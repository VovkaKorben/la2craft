const express = require('express');
const http = require('http'); // Добавили стандартный модуль http
const { Server } = require('socket.io'); // Правильный импорт Socket.io

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 49999;
const clients = new Map();

// КРИТИЧНО: Учим сервер принимать сырые байты от бота
app.use(express.raw({ type: 'application/octet-stream', limit: '1mb' }));

io.on('connection', (socket) => {
    socket.on('auth', (guid) => {
        clients.set(guid, socket);
        console.log(`Реакт подключен: ${guid}`);
    });

    // Очищаем Map при отключении
    socket.on('disconnect', () => {
        for (let [guid, s] of clients) {
            if (s === socket) { clients.delete(guid); break; }
        }
    });
});

app.post('/update', (req, res) => {
    const guid = req.query.guid; // Вынимаем GUID из URL
    const targetSocket = clients.get(guid);
    console.log(guid);
    if (targetSocket && req.body.length > 0) {
        // Выстреливаем Buffer (байты) напрямую в Реакт
        targetSocket.emit('inventory_new', req.body);
    }
    res.sendStatus(200);
});

// ВНИМАНИЕ: Слушаем теперь server, а не app
server.listen(port, () => {
    console.log(`Сервер-приемник готов на порту ${port}`);
});