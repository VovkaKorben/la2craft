import dotenv from 'dotenv';
import { createSmartDict2 } from './SmartMap.js';
import { openDb } from './dbUtils.js';

dotenv.config();



const { SQLITE_DB } = process.env;



const process_craft = async (params, id_mk, count, level = 0) => {
    try {


        
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
        

        for (const sub of params.cache[id_mk].input) {

            let sub_required = hit_count * sub.count;
            params.inventory[sub.item_id] -= sub_required;
            if (params.inventory[sub.item_id] < 0) {


                const missing_qty = Math.abs(params.inventory[sub.item_id]);
                if (sub.id_mk && !params.excluded.includes(sub.id_mk)) {

                    const crafted = await process_craft(params, sub.id_mk, missing_qty, level + 1);
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

    const sorted_craft = Object.values(params.craft).sort((a, b) => { return b.level - a.level; });
    return {
        craft: sorted_craft,
        lack: sorted_lack
    };
}
