import dotenv from 'dotenv';



import { stringifyWithDepthLimit } from '../src/debug.js';
import { createSmartDict2 } from './SmartMap.js';
import { openDb } from './dbUtils.js';

dotenv.config();

const { SQLITE_DB } = process.env;

const item_name = async (db, id) => {
    const i = await db.get(`SELECT name FROM items WHERE id=?`, [id]);
    return i.name;

}

const recipe_name = async (db, id_mk) => {
    const i = await db.get(`SELECT 	i.name FROM	recipes r,	items i WHERE i.id = r.id_item and	id_mk = ?`, [id_mk]);
    return i.name;

}


const process_craft = async (params, id_mk, count, level = 0) => {
    try {


        console.log(`-----------------------------------`);

        // check recipe in cache
        if (!(id_mk in params.cache)) {
            // read recipe from DB
            const rdata = await params.db.get(`
                                            select i.name as item_name, i.id as item_id, i.icon, r.count as output, r.price,r.id_mk
                                            from recipes r
                                            LEFT JOIN items i ON i.id = r.id_item
                                            where r.id_mk = ?`, [id_mk]);
            params.cache[id_mk] = {
                ...rdata,
                input: []
            };
            // read the materials with their (possible) recipes
            const mdata = await params.db.all(`
                                            SELECT m.material_id, m.material_count, i.icon, i.name as item_name, r.price,r.id_mk
                                            FROM materials m 
                                            LEFT JOIN items i ON i.id = m.material_id
                                            LEFT JOIN recipes r ON r.id_item = m.material_id
                                            WHERE m.id_mk = ?
                                            `, [id_mk]);
            mdata.forEach((material) => {

                if (!params.item_info[sub.item_id]) {
                    params.item_info[sub.item_id] = {
                        item_name: sub.item_name,
                        icon: sub.icon,
                        price: sub.price,
                        // что там еще тебе нужно
                    };
                }


                params.cache[id_mk].input.push({
                    item_name: material.item_name,
                    item_id: material.material_id,
                    count: material.material_count,
                    id_mk: material.id_mk,
                    icon: material.icon,
                    price: material.price
                })
            });
        }
        console.log(`to craft: ${await recipe_name(params.db, id_mk)} (${count})`);
        console.log(stringifyWithDepthLimit(params.cache[id_mk], 2));



        if (!(id_mk in params.craft)) {
            // add new craft step
            params.craft[id_mk] = {
                'item_name': await item_name(params.db, params.cache[id_mk].item_id),
                'level': level,
                'hits': 0,
                'output': params.cache[id_mk].output,
                'item_id': params.cache[id_mk].item_id,

                'price': params.cache[id_mk].price,
                'icon': params.cache[id_mk].icon
            };
        } else {
            // check level
            params.craft[id_mk].level = Math.max(params.craft[id_mk].level, params.level);
        }

        const hit_count = Math.ceil(count / params.cache[id_mk].output);
        params.craft[id_mk].hits += hit_count;
        console.log(`hit_count: ${hit_count}`);




        for (const sub of params.cache[id_mk].input) {

            let sub_required = hit_count * sub.count;
            params.inventory[sub.item_id] -= sub_required;
            if (params.inventory[sub.item_id] < 0) {


                const missing_qty = Math.abs(params.inventory[sub.item_id]);
                console.log(`\n*** missing_qty: ${stringifyWithDepthLimit(sub, 0)}\n Missing_qty:${missing_qty}`);
                if (sub.id_mk) {

                    const crafted = await process_craft(params, sub.id_mk, missing_qty, level + 1);
                    console.log(`\n+++ crafted: ${crafted}`);
                    params.inventory[sub.item_id] += crafted;
                    // update level
                    params.craft[sub.id_mk].level = Math.max(params.craft[sub.id_mk].level, params.level);
                } else {
                    // atomic - nothing to do
                }

            }

        }
        const retval = hit_count * params.cache[id_mk].output;
        return retval;
    } catch (err) {
        console.error('error:', err);
    };
}


export const craft_init = async (data) => {
    // const databaseConnection = ;
    const params = {
        cache: {},
        db: await openDb(),

        inventory: createSmartDict2(data.inventory), // production => replace true with use_inventory
        craft: {},
        item_info: {},

    };
    for (const [key, value] of Object.entries(data.schedule)) {
        await process_craft(params, value.id_mk, value.count);
    }



    const finalLack = {};

    // Бежим по парам [ID, Count]
    Object.entries(params.inventory).forEach(([id, count]) => {

        // Берем только те, где МИНУС (дефицит)
        if (count < 0) {
            // Достаем инфу о предмете, которую мы сохранили в item_info
            // (защита || {} на случай, если вдруг инфы нет)
            const info = params.item_info[id] || { item_name: 'Unknown', icon: '' };

            finalLack[id] = {
                item_id: id,            // ID важен
                count: Math.abs(count), // Превращаем -10 в +10
                item_name: info.item_name, // Имя
                icon: info.icon,           // Иконка
                price: info.price          // Цена
            };
        }
    });

    const lack = params.inventory
        .filter((count) => count < 0)
        .map((item) => -item);

    console.log(`\n`);
    for (const [key, value] of Object.entries(params.lack)) {
        console.log(`LACK: ${await item_name(params.db, key)}: ${value}`);
    }
    console.log(`CRAFT: `);
    let overall_price = 0;
    const sorted_craft = Object.values(params.craft).sort((a, b) => { return b.level - a.level; });
    sorted_craft.forEach((value) => {
        console.log(`[${value.level}]${value.item_name}: ${value.count}(price: ${value.count * value.price})`);
        overall_price += value.count * value.price;
    });
    console.log(`overall_price: ${overall_price}`);

    /*for (const [key, value] of Object.entries(params.craft)) {
      console.log(`CRAFT: ${ value.item_name }: ${ value.count }(price: ${ value.count * value.price })`);
    }*/
    return {
        craft: sorted_craft,
        lack: Object.values(params.lack)
    };


}
const data = {
    inventory: {},
    /* {
        "1884": 20,//	Cord	
        "1882": 0, //	Leather	
        "1870": 1000 //	Coal	
    },*/

    schedule: {

        "104": {
            "item_id": 1894,
            "item_name": "CL",
            "icon": "armor_t47_u_i00",
            "success_rate": 100,
            "id_mk": 41,
            "variants_count": 1,
            "count": 1
        },

        /*
        "104": {
          "item_id": 398,
          "item_name": "Plated Leather",
          "icon": "armor_t47_u_i00",
          "success_rate": 100,
          "id_mk": 104,
          "variants_count": 1,
          "count": 1
        },
        "105": {
          "item_id": 418,
          "item_name": "Plated Leather Gaiters",
          "icon": "armor_t47_l_i00",
          "success_rate": 100,
          "id_mk": 105,
          "variants_count": 1,
          "count": 1
        },
        "283": {
          "item_id": 2431,
          "item_name": "Plated Leather Boots",
          "icon": "armor_t47_b_i00",
          "success_rate": 100,
          "id_mk": 283,
          "variants_count": 1,
          "count": 1
        },
        "290": {
          "item_id": 2455,
          "item_name": "Plated Leather Gloves",
          "icon": "armor_t47_g_i00",
          "success_rate": 100,
          "id_mk": 290,
          "variants_count": 1,
          "count": 1
        
          }
          */
    },
    use_composite: false,


}


console.log(
    stringifyWithDepthLimit(await craft_init(data), 2)
);

