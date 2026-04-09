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
        console.log(`[io.on connection] Connected GUID: ${guid}`); // ЛОГ


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

    // Создаем пакет: данные + метка времени
    const items = {};
    for (let i = 0; i < req.body.length; i += 8) {
        const item_id = req.body.readUInt32LE(i);
        const item_count = req.body.readUInt32LE(i + 4);
        items[item_id] = item_count;
    }
    const items_total = Object.keys(items).length;
    const updatePackage = {
        items: items,
        timestamp: Date.now()
    };

    lastDataCache.set(guid, updatePackage);
    console.log(`[POST /inventory] For ${guid} recieved: ${items_total} items`);


    const targetSocket = clients.get(guid);


    // console.log(`[updatePackage]`, JSON.stringify(updatePackage).substring(0, 150) + '...');
    if (targetSocket) {
        // Отправляем байты в Реакт
        // console.log(`[DEBUG] Отправляю в сокет:`, JSON.stringify(updatePackage).substring(0, 150) + '...');
        targetSocket.emit('inventory_new', updatePackage);
        console.log(`[WSS] Emitted to ${guid}`);
    } else if (!targetSocket) {
        console.log(`[!] Error: React GUID ${guid} not connected to socket!`);
    }

    res.sendStatus(200);
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Listening on ${port}`);
});