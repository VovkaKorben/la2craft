import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import morgan from 'morgan';



import { errorHandler, notFound } from './middleware/error.js';
// const openDb = require('./db'); // Импортируем нашу функцию
import { openDb } from './dbUtils.js';

dotenv.config();

const { API_PORT = 3500, SQLITE_DB } = process.env;

const db = new sqlite3.Database(`./${SQLITE_DB}`);

const app = express();
app.use(cors());

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev'));
const server = app.listen(API_PORT, () => {
  console.log(`🟩 API started on http://localhost:${API_PORT}`);
  console.log(`💗 Health check with http://localhost:${API_PORT}/api/health`);
});


// GET-STATUS route
app.get('/api/health', async (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/search', async (req, res) => {
  const { substr, type, grade } = req.body;


  try {
    const db = await openDb();

    // check user  exists
    const data = await db.all("SELECT id,name,icon FROM items WHERE name LIKE '%' || ? || '%'", [substr]);



    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error('error:', err);
    res.status(500).json({
      success: false,
      error: err.stack
    });
  }
});



app.use(notFound);
app.use(errorHandler);
