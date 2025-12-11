import dotenv from 'dotenv';



import { stringifyWithDepthLimit } from '../src/debug.js';
import { createSmartDict } from './SmartMap.js';
import { openDb } from './dbUtils.js';

dotenv.config();

const { SQLITE_DB } = process.env;

const item_name = async (db, id) => {
    const i = await db.get(`SELECT name FROM items WHERE id=?`, id);
    return i.name;

}

const recipe_name = async (db, id_mk) => {
    const i = await db.get(`SELECT 	i.name FROM	recipes r,	items i WHERE i.id = r.id_item and	id_mk = ?`, id_mk);
    return `recipe_name: ${i.name}`;

}

const process_craft = async (params, id_mk, count) => {
    try {

        // check recipe in cache
        if (!(id_mk in params.cache)) {
            // read recipe from DB
            const rdata = await params.db.get(`SELECT count as output  FROM recipes WHERE id_mk=?`, id_mk);
            params.cache[id_mk] = { output: rdata.output, input: {} };
            const mdata = await params.db.all(`SELECT material_id,material_count FROM materials WHERE id_mk=?`, id_mk);
            mdata.forEach((material) => {
                params.cache[id_mk].input[material.material_id] = material.material_count;
            });
        }

        console.log(await recipe_name(params.db, id_mk));
        // for each material try obtain recipe
        const materials = Object.keys(params.cache[id_mk].input);
        const placeholders = materials.map(() => '?').join(',');
        const sub_materials = await params.db.all(`select i.id as item_id, i.name as item_name, i.icon,  r.id_mk,r.price from items i left join recipes r on r.id_item = i.id where i.id in ( ${placeholders} )`, materials);
        // console.log(stringifyWithDepthLimit(sub_materials, 1));

        // calculate required count to craft
        //const iteration_required = Math.ceil(count / params.cache[id_mk].output);
        // console.log(`iteration_required: ${iteration_required}`);

        // if material has recipe - call self again
        for (const sub of sub_materials) {

            let sub_count = count * params.cache[id_mk].input[sub.item_id];
            console.log(`* subitem: ${await item_name(params.db, sub.item_id)} (${sub_count})`);

            const use_inventory = Math.min(params.inventory[sub.item_id], sub_count); // how many can get from WH
            params.inventory[sub.item_id] -= use_inventory; // retrieve from WH

            sub_count -= use_inventory; // how many remain to craft



            if (sub_count) {
                if (sub.id_mk) {
                    // composite

                    params.level++;

                    if (!(sub.id_mk in params.craft)) {
                        // add new craft step
                        params.craft[sub.id_mk] = {
                            'level': params.level,
                            'count': 0,
                            'item_id': sub.item_id,
                            'item_name': await item_name(params.db, sub.item_id),
                            'price': sub.price,
                            'icon': sub.icon
                        };
                    } else {
                        // check level
                        params.craft[sub.id_mk].level = Math.max(params.craft[sub.id_mk].level, params.level);
                    }
                    // iteration count
                    const iteration_count = Math.ceil(sub_count / params.cache[id_mk].output[sub.item_id]);
                    console.log(`${'-'.repeat(params.level * 10)}  ${params.craft[sub.id_mk].item_name} * ${sub_count}`);
                    params.craft[sub.id_mk]['count'] += sub_count;
                    await process_craft(params, sub.id_mk, sub_count);

                    params.level--;
                } else {
                    // atomary

                    // check if LACK-item already exists
                    if (!(sub.item_id in params.lack)) {
                        params.lack[sub.item_id] = { count: 0, icon: sub.icon, item_id: sub.item_id, item_name: sub.item_name }
                    }
                    params.lack[sub.item_id].count += sub_count;

                }
            }
        };


    } catch (err) {
        console.error('error:', err);
    };
}


export const craft_init = async (data) => {
    const params = {
        cache: {},
        db: await openDb(),
        level: 0,
        inventory: createSmartDict(data.inventory), // production => replace true with use_inventory
        lack: {},
        craft: {}
    };
    for (const [key, value] of Object.entries(data.schedule)) {
        await process_craft(params, value.id_mk, value.count);
        params.craft[value.id_mk] = {
            'level': 0,
            'count': value.count,
            'item_id': value.item_id,
            'item_name': value.item_name,
            'price': null,
            'icon': value.icon
        };

    }

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
    inventory: {
        "1884": 20,//	Cord	
        "1882": 0, //	Leather	
        "1870": 1000 //	Coal	
    },

    schedule: {

        "104": {
            "item_id": 1894,
            "item_name": "CL",
            "icon": "armor_t47_u_i00",
            "success_rate": 100,
            "id_mk": 41,
            "variants_count": 1,
            "count": 50
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

