select 
i.name,i.icon,i.bodypart
from items i,recipes r
where r.id_item = i.id -- only with existing recipes
and i.bodypart is Not null -- disable shots/elixires
and i.crystal_type is not null -- disable NG
and i.type <> 'EtcItem' -- disable arrows
AND NOT (r.level >= 7 AND r.success_rate = 100) -- disable 100% top recipes
and i.name like '%' || 'arca' || '%'
order by 
-- i.bodypart
INSTR('DCBAS', i.crystal_type),i.name
