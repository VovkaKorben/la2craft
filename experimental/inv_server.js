// inv_server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    path: '/inventory/socket.io', // Явно указываем путь здесь
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const port = 49999;
const clients = new Map();
const lastDataCache = new Map(); // Наша новая "память"

app.use(express.raw({ type: 'application/octet-stream', limit: '20kb' }));

io.on('connection', (socket) => {
    // ХИТРОСТЬ: Забираем GUID прямо из рукопожатия (handshake)
    const guid = socket.handshake.query.guid;

    if (guid) {
        clients.set(guid, socket);
        console.log(`[SOCKET] Подключен клиент GUID: ${guid}`); // ЛОГ


        // ПРОВЕРКА ПАМЯТИ: Если в сейфе что-то есть — отдаем сразу
        const cachedData = lastDataCache.get(guid);
        if (cachedData) {
            socket.emit('inventory_new', cachedData);
            console.log(`[WSS] Кэшированные данные отправлены новому клиенту: ${guid}`);
        }
    }

    socket.on('disconnect', () => {
        if (guid) {
            clients.delete(guid);
            console.log(`[SOCKET] Отключен клиент GUID: ${guid}`); // ЛОГ
        }
    });
});


// GET-STATUS route
app.get('/inventory/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server: 'inv_server',
        active_clients: clients.size // Показываем размер нашей Map с GUID
    });
});

app.post('/inventory', (req, res) => {
    const guid = req.query.guid;

    lastDataCache.set(guid, req.body);
    console.log(`[HTTP] Данные сохранены для ${guid}: ${req.body.length} байт`);


    const targetSocket = clients.get(guid);

    console.log(`[HTTP] Получены данные для ${guid}: ${req.body.length} байт`);

    if (targetSocket && req.body.length > 0) {
        // Отправляем байты в Реакт
        targetSocket.emit('inventory_new', req.body);
        console.log(`[WSS] Данные успешно пересланы в Реакт для ${guid}`);
    } else if (!targetSocket) {
        console.log(`[!] Ошибка: Реакт с GUID ${guid} не подключен к сокету!`);
    }

    res.sendStatus(200);
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Сервер-приемник готов на порту ${port}`);
});