  <div className="type_selector">
          <ButtonSelector
            initValue={filterType}
            onChange={filterTypeChanged}
            type="type"
          />
        </div>
        <div className="grade_selector">
          <ButtonSelector
            initValue={filterGrade}
            onChange={filterGradeChanged}
            type="grade"
          />
        </div>











/*
           const sub_count = iteration_count * sub.count;
           console.log(`sub: ${await item_name(params.db, sub.item_id)} *${sub.count} = ${sub_count}`);
           if (sub.id_mk) {  // composite

               console.log(`composite!`);
               // const iteration_count = Math.ceil(count / params.cache[id_mk].output);
               // console.log(`iteration_count: ${iteration_count}`);



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







           } else { // atomic

              
           }
       }



   }






       // for each material try obtain recipe
       // const materials = Object.keys(params.cache[id_mk].input);
       // const placeholders = materials.map(() => '?').join(',');
       // const sub_materials = await params.db.all(`select i.id as item_id, i.name as item_name, i.icon,  r.id_mk,r.price from items i left join recipes r on r.id_item = i.id where i.id in ( ${placeholders} )`, materials);
       // // console.log(stringifyWithDepthLimit(sub_materials, 1));

       // calculate required count to craft
       //const iteration_required = Math.ceil(count / params.cache[id_mk].output);
       // console.log(`iteration_required: ${iteration_required}`);

       // if material has recipe - call self again
     /*  for (const sub of sub_materials) {

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



           }
       }
           */


const use_inventory = params.inventory[sub.item_id] >= 0 ? params.inventory[sub.item_id] : 0

Math.min(params.inventory[sub.item_id], sub_required); // how many can get from WH
params.inventory[sub.item_id] -= use_inventory; // retrieve from WH
sub_required -= use_inventory; // how many remain to craft







if (sub_required) {
  if (sub.id_mk) {  // composite
    const crafted = await process_craft(params, sub.id_mk, sub_required);
    // put rest to inv
    params.inventory[sub.item_id] += crafted - sub_required;
    params.craft[sub.id_mk].level = Math.max(params.craft[sub.id_mk].level, params.level);
  } else { // atomic
    // check if LACK-item already exists
    //if (!(sub.item_id in params.lack)) {                        params.lack[sub.item_id] = { count: 0, icon: sub.icon, item_id: sub.item_id, item_name: sub.item_name }                    }
    params.inventory[sub.item_id].count -= sub_required;
  }
}
