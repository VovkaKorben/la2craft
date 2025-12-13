import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import morgan from 'morgan';


import { craft_init } from './craft_logic.js';



import { errorHandler, notFound } from './middleware/error.js';
import { stringifyWithDepthLimit } from '../src/debug.js';
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
      select i.id as item_id, i.name as item_name,i.icon,r.success_rate,r.id_mk,COUNT(i.id) OVER (PARTITION BY i.id) as variants_count
      from items i,recipes r
      where r.id_item = i.id 
      and i.bodypart is Not null
      and i.crystal_type is not null
      and i.type <> 'EtcItem' 
      AND NOT (r.level > 7 AND r.success_rate = 100)
      and i.name like '%' || ? || '%'
      order by INSTR('DCBAS', i.crystal_type) desc,i.name asc,r.success_rate desc;
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




/*
const xxx = {
  "inventory": {
    "26": 1, "39": 2, "43": 1, "57": 194451021, "158": 1, "182": 1, "219": 1, "226": 1, "352": 2, "355": 1, "381": 1, "604": 1, "605": 2, "612": 1, "626": 3, "729": 1, "730": 4, "734": 341,
    "736": 37, "737": 40, "850": 2, "879": 2, "917": 1, "948": 2, "951": 9, "1060": 313, "1342": 35881, "1343": 87510, "1458": 2332, "1459": 1391, "1460": 3318, "1464": 2, "1539": 1620, "1785": 8846, "1829": 168,
    "1830": 45, "1864": 55132, "1865": 25450, "1866": 17124, "1867": 29169, "1868": 56751, "1869": 38296, "1870": 10276, "1871": 33377, "1872": 98976, "1873": 13984,
    "1874": 193, "1875": 827, "1876": 7279, "1877": 682, "1878": 5394, "1879": 1079, "1880": 426, "1881": 937, "1882": 1434,
    "1884": 88719, "1885": 1125, "1887": 97, "1888": 8, "1889": 1782, "1892": 4, "1894": 1808, "1895": 9578, "2212": 1, "2217": 28, "2378": 2, "2397": 1, "2425": 1, "2438": 1, "2449": 1,
    "2496": 1, "2970": 15, "3875": 2, "3877": 26, "3878": 4, "3879": 8, "3880": 4, "3881": 3, "3883": 21, "3884": 15,
    "3887": 11, "3888": 10, "3926": 18, "3927": 15, "3928": 9, "3929": 6, "3930": 27, "3931": 9, "3932": 9, "3933": 12, "3934": 12, "3935": 6, "3958": 5, "3959": 3, "4039": 3, "4040": 323, "4041": 710, "4042": 323, "4043": 413,
    "4044": 228, "4048": 1, "4078": 23, "4080": 89, "4081": 54, "4090": 68, "4096": 23, "4154": 73, "4155": 10,
    "4157": 21, "4158": 12, "4167": 23, "4168": 36, "4173": 4, "4198": 23, "4591": 20, "4624": 3, "4745": 1, "4936": 1, "4970": 2, "5220": 236, "5368": 9, "5426": 2, "5430": 6, "5432": 20, "5434": 1, "5448": 1,
    "5456": 1, "5536": 6, "5549": 3064, "5550": 194, "5557": 2, "5558": 3, "5559": 1, "5575": 35963235, "5707": 1, "6035": 22, "6036": 45, "6313": 1, "6337": 13, "6339": 22, "6360": 1153607, "6361": 1351166,
    "6362": 142420, "7079": 9573, "7881": 1, "8595": 1, "8724": 1, "8725": 4, "8740": 1, "8745": 1, "8746": 8, "8947": 1
  },
  "requested":

  {
    "405": {
      "name": "Blue Wolf Helmet",
      "icon": "armor_leather_helmet_i00",
      "success_rate": 60,
      "id_mk": 405,
      "count": 1
    },
    "406": {
      "name": "Blue Wolf Helmet",
      "icon": "armor_leather_helmet_i00",
      "success_rate": 100,
      "id_mk": 406,
      "count": 2
    },
    "421": {
      "name": "Blue Wolf Gloves",
      "icon": "armor_t68_g_i02",
      "success_rate": 60,
      "id_mk": 421,
      "count": 1
    },
    "422": {
      "name": "Blue Wolf Gloves",
      "icon": "armor_t68_g_i02",
      "success_rate": 100,
      "id_mk": 422,
      "count": 2
    }

  },

  "use_composite": false

}

const item_name = async (db, id) => {
  const i = await db.get(`SELECT name FROM items WHERE id=?`, id);
  return i.name;

}

const process_craft = async (params, id_mk, count) => {
  try {

    // check recipe in cache
    if (!(id_mk in params.cache)) {
      // read recipe from DB
      params.cache[id_mk] = {};
      const data = await params.db.all(`SELECT material_id,material_count FROM materials WHERE id_mk=?`, id_mk);
      data.forEach((material) => {
        params.cache[id_mk][material.material_id] = material.material_count;
      });
    }

    // for each material try obtain recipe
    const materials = Object.keys(params.cache[id_mk]);
    const placeholders = materials.map(() => '?').join(',');
    const sub_materials = await params.db.all(`
      select i.id item_id,r.id_mk from items i
      left join recipes r on r.id_item = i.id 
      where i.id in ( ${placeholders} )
      `, materials);
    console.log(stringifyWithDepthLimit(sub_materials, 1));

    // if material has recipe - call self again
    for (const sub of sub_materials) {

      const sub_count = count * params.cache[id_mk][sub.item_id];
      if (sub.id_mk) {
        // composite
        params.level++;
        params.craft[sub.item_id] += sub_count;
        await process_craft(params, sub.id_mk, sub_count);

        params.level--;
      } else {
        // atomary
        console.log(`atomary: ${await item_name(params.db, sub.item_id)} * ${sub_count}`);

        const use_count = Math.min(params.inventory[sub.item_id], sub_count);
        params.inventory[sub.item_id] -= use_count;
        params.lack[sub.item_id] += sub_count - use_count;

      }

    };


  } catch (err) {
    console.error('error:', err);
  };
}


const init = async (v) => {
  const params = {
    cache: {},
    db: await openDb(),
    level: 0,
    inventory: createSmartDict(true ? v.inventory : {}), // production => replace true with use_inventory
    lack: createSmartDict(),
    craft: createSmartDict()
  };
  for (const [key, value] of Object.entries(v.requested)) {
    await process_craft(params, value.id_mk, value.count);
  }

  for (const [key, value] of Object.entries(params.lack)) {
    console.log(`LACK: ${await item_name(params.db, key)}: ${value}`);
  }

  for (const [key, value] of Object.entries(params.craft)) {
    console.log(`CRAFT: ${await item_name(params.db, key)}: ${value}`);
  }
  return 0;


}
*/
