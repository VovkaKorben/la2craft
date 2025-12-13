import dotenv from 'dotenv';



import { stringifyWithDepthLimit } from '../src/debug.js';
import { createSmartDict2 } from './SmartMap.js';
import { openDb } from './dbUtils.js';

dotenv.config();

const CONSOLE = false;

const { SQLITE_DB } = process.env;

if (CONSOLE) {
    const item_name = async (db, id) => {
        const i = await db.get(`SELECT name FROM items WHERE id=?`, [id]);
        return i.name;

    }

    const recipe_name = async (db, id_mk) => {
        const i = await db.get(`SELECT 	i.name FROM	recipes r,	items i WHERE i.id = r.id_item and	id_mk = ?`, [id_mk]);
        return i.name;

    }
}

const process_craft = async (params, id_mk, count, level = 0) => {
    try {


        if (CONSOLE) console.log(`-----------------------------------`);

        // check recipe in cache
        if (!(id_mk in params.cache)) {
            // read recipe from DB
            const recipe_data = await params.db.get(`
                                            select 
                                                i.name as item_name, 
                                                i.id as item_id, 
                                                i.icon, 
                                                r.count as output, 
                                                r.price,r.id_mk,
                                                r.success_rate as chance
                                            from recipes r
                                            LEFT JOIN items i ON i.id = r.id_item
                                            where r.id_mk = ?`, [id_mk]);
            params.cache[id_mk] = {
                ...recipe_data,
                input: []
            };
            // read the materials with their (possible) recipes
            const material_data = await params.db.all(`
                                            SELECT 
                                                m.material_id, 
                                                m.material_count, 
                                                i.icon, 
                                                i.name as item_name, 
                                                r.id_mk,
                                                i.sort_order
                                            FROM materials m 
                                            LEFT JOIN items i ON i.id = m.material_id
                                            LEFT JOIN recipes r ON r.id_item = m.material_id
                                            WHERE m.id_mk = ?
                                            `, [id_mk]);
            material_data.forEach((material) => {

                // update item info
                if (!params.item_info[material.material_id]) {
                    params.item_info[material.material_id] = {
                        item_name: material.item_name,
                        icon: material.icon,
                        sort_order: material.sort_order
                        // price: material.price,

                    };
                }


                params.cache[id_mk].input.push({
                    item_name: material.item_name,
                    item_id: material.material_id,
                    count: material.material_count,
                    id_mk: material.id_mk,
                    icon: material.icon,
                    price: material.price,
                    // chance: success_rate
                })
            });
        }
        if (CONSOLE) console.log(`to craft: ${await recipe_name(params.db, id_mk)} (${count})`);
        if (CONSOLE) console.log(stringifyWithDepthLimit(params.cache[id_mk], 2));



        if (!(id_mk in params.craft)) {
            // add new craft step
            params.craft[id_mk] = {
                'item_name': params.cache[id_mk].item_name,
                'level': level,
                'hits': 0,
                'output': params.cache[id_mk].output,
                'item_id': params.cache[id_mk].item_id,

                'price': params.cache[id_mk].price,
                'icon': params.cache[id_mk].icon,
                'chance': params.cache[id_mk].chance,
            };
        } else {
            // update level
            params.craft[id_mk].level = Math.max(params.craft[id_mk].level, level);
        }

        const hit_count = Math.ceil(count / params.cache[id_mk].output);
        params.craft[id_mk].hits += hit_count;
        if (CONSOLE) console.log(`hit_count: ${hit_count}`);




        for (const sub of params.cache[id_mk].input) {

            let sub_required = hit_count * sub.count;
            params.inventory[sub.item_id] -= sub_required;
            if (params.inventory[sub.item_id] < 0) {


                const missing_qty = Math.abs(params.inventory[sub.item_id]);
                if (CONSOLE) console.log(`\n*** missing_qty: ${stringifyWithDepthLimit(sub, 0)}\n Missing_qty:${missing_qty}`);
                if (sub.id_mk && !params.excluded.includes(sub.id_mk)) {

                    const crafted = await process_craft(params, sub.id_mk, missing_qty, level + 1);
                    if (CONSOLE) console.log(`\n+++ crafted: ${crafted}`);
                    params.inventory[sub.item_id] += crafted;


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
        excluded: data.excluded

    };
    for (const [key, value] of Object.entries(data.schedule)) {
        await process_craft(params, value.id_mk, value.count);
    }


    // extract from inv lack elements
    const finalLack = [];
    Object.entries(params.inventory).forEach(([id, count]) => {
        if (count < 0) {
            const info = params.item_info[id];
            finalLack.push({
                item_id: parseInt(id),
                count: Math.abs(count),
                item_name: info.item_name,
                icon: info.icon,
                sort_order: info.sort_order
            });
        }
    });
    const sorted_lack = finalLack.sort((a, b) => { return a.sort_order - b.sort_order; });
// console.log(stringifyWithDepthLimit(sorted_lack, 1));

    const sorted_craft = Object.values(params.craft).sort((a, b) => { return b.level - a.level; });
    return {
        craft: sorted_craft,
        lack: sorted_lack
    };
}


/*
const data = {
    inventory: {},


    schedule: {


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

    },
    use_composite: false,


}


console.log(
    stringifyWithDepthLimit(await craft_init(data), 2)
);



*/