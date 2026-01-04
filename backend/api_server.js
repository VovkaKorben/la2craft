import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import morgan from 'morgan';


import { craft_init } from './craft_logic.js';
import { initGlyphService, generateGlyphBuffer } from './num_font.js';
initGlyphService();

import { errorHandler, notFound } from './middleware/error.js';
import { createSmartDict } from './SmartMap.js';
// const openDb = require('./db'); // Импортируем нашу функцию
import { openDb } from './dbUtils.js';

dotenv.config();

const { API_PORT = 3500, SQLITE_DB } = process.env;


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


app.get('/api/glyph', (req, res) => {
    const value = req.query.v;
    if (!value) return res.status(400).send('No value');

    const buffer = generateGlyphBuffer(value);
    
    if (!buffer) {
        return res.status(500).send('Generator not ready or error');
    }

    res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=31536000, immutable'
    });

    res.send(buffer);
});


app.post('/api/excludedids', async (req, res) => {



  try {
    const db = await openDb();
    const data = await db.all(`
    SELECT i.name, i.icon, r.id_mk, r.price
     FROM recipes r 
     left JOIN items i on r.id_item = i.id
     WHERE r.price is not null
     order by r.level asc, i.name asc
      `);

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




app.post('/api/search', async (req, res) => {
  const { substr, type, grade } = req.body;


  try {
    let data = [];
    if (substr.trim() !== '') {
      const db = await openDb();

      // check user  exists
      data = await db.all(`
          select
              i.id as item_id, 
              i.name as item_name,
              i.icon,r.success_rate,
              r.id_mk,
              i.sort_order
              
          from items i,recipes r
          where r.id_item = i.id 
          and i.bodypart is Not null
          and i.crystal_type is not null
          and i.type <> 'EtcItem' 
          AND NOT (r.level > 7 AND r.success_rate = 100)
          and i.name like '%' || ? || '%'
          order by
              i.sort_order;
      `, [substr]);

    }

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



app.post('/api/solution', async (req, res) => {
  const { inventory, excluded, schedule } = req.body;
  // console.log(`schedule: ${JSON.stringify(schedule)}`);

  try {


    const solution = await craft_init({
      inventory: inventory,
      schedule: schedule,
      excluded: excluded
    });

    return res.status(200).json({
      success: true,
      data: solution
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


