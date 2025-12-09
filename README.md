запрос новый
+r.success_rate
+r.id_mk

+ наверно ввести поле показывать, т.е. перил или ланс 7 лвл крафта, а все 7 лвла это уже обычно А грейд, где нет 100%

select i.name,i.icon,r.success_rate,r.id_mk
from items i,recipes r
where r.id_item = i.id -- only with existing recipes
and i.bodypart is Not null -- disable shots/elixires
and i.crystal_type is not null -- disable NG
and i.type <> 'EtcItem' -- disable arrows
AND NOT (r.level >= 7 AND r.success_rate = 100) -- disable 100% top recipes
and i.name like '%' || 'valh' || '%'
order by INSTR('DCBAS', i.crystal_type) desc,i.name asc,r.success_rate desc;




requested = список айди и количество
inventory = то же, но для инв
use_composite = 1 использовать уже сделанное сборное
                0 делать с нуля

рецепты кешируем           

lvl = 0
берем первый id_mk                              405
    находим для него список материалов          select material_id,material_count from materials where id_mk = 405
    lvl += 1
    для каждого материала                       4990    4088    1892    1894    4043    1460    2132
        смотрим, есть ли для него рецепт

                select m.material_id, m.material_count, i.name, r.id_mk
                from materials m 
                left join items i on i.id = m.material_id -- for debug
                left join recipes r on m.material_id = r.id_item
                
                where m.id_mk in (405,406,421,422)
                order by i.name


    lvl -= 1

    

    наверно нужно в process_craft передавать по 1 mk_id + count
    смотрим, есть ли для него рецепт 