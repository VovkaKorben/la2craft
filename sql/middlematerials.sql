SELECT i.name, i.icon, r.id_mk 
FROM recipes r 
left JOIN items i on r.id_item = i.id
WHERE r.price is not null
order by r.level asc, i.name asc