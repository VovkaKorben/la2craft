import { useState, useEffect } from 'react'
import './assets/css/App.css';
import './assets/css/flex.css';
import './assets/css/import.css';
import './assets/css/vcl.css';
import TextInput from './comps/TextInput.jsx';
import ButtonSelector from './comps/ButtonSelector.jsx';
import { loadArrayFromLS, loadDataFromLS } from './utils.jsx';
import { IconPng } from './comps/IconPng.jsx';
import { SearchItem, ScheduleItem } from './comps/ListItems.jsx';
import InvImport from './comps/InvImport.jsx';
const API_BASE_URL = 'http://localhost:3500/api/';



function App() {

  const [itemSearch, setItemSearch] = useState(localStorage.getItem("itemSearch") || "");
  const [filterType, setFilterType] = useState(() => loadArrayFromLS("filterType", 3));
  const [filterGrade, setFilterGrade] = useState(() => loadArrayFromLS("filterGrade", 5));
  const [searchList, setSearchList] = useState([]);
  const [inventory, setInventory] = useState(() => loadDataFromLS("inventory", []));
  const [inventoryImporting, setInventoryImporting] = useState(false);
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => { localStorage.setItem("itemSearch", itemSearch); }, [itemSearch]);
  useEffect(() => { localStorage.setItem("filterType", JSON.stringify(filterType)); }, [filterType]);
  useEffect(() => { localStorage.setItem("filterGrade", JSON.stringify(filterGrade)); }, [filterGrade]);
  useEffect(() => { localStorage.setItem('schedule', JSON.stringify(schedule)); }, [schedule]);

  useEffect(() => {
    const handleSearch = async (data) => {

      const resp = await fetch(`${API_BASE_URL}search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(data)
      });

      const result = await resp.json();
      if (resp.ok && result.success) {


        setSearchList(result.data);
      } else {
        setSearchList(<><b><u>search error:</u></b><br /> {result.error}</>);
      }


    }
    const data = {
      substr: itemSearch,
      type: filterType,
      grade: filterGrade
    }
    handleSearch(data);
  },
    [itemSearch, filterType, filterGrade]);

  const itemSearchChanged = (value) => { setItemSearch(value); }
  const filterTypeChanged = (value) => { setFilterType(value); }
  const filterGradeChanged = (value) => { setFilterGrade(value); }
  const inventoryImportDone = (incomingData) => {
    setInventoryImporting(false);
    // 2. Проверяем: если пришел НЕ null, значит нажали OK и данные есть
    if (incomingData !== null) {
      console.log("Импортировано:", incomingData);

      // 3. Обновляем стейт
      setInventory(incomingData);

      // 4. Важный момент: Сохранение в LocalStorage
      // Если у вас нет useEffect, который следит за inventory, сохраните вручную тут:
      localStorage.setItem("inventory", JSON.stringify(incomingData));
    } else {
      console.log("Импорт отменен пользователем");
    }


  };

  const searchItemClick = (item) => {



    setSchedule((prev) => {
      const existingItem = prev[item.id];

      if (existingItem) {
        return {
          ...prev,
          [item.id]: {
            ...existingItem,
            count: existingItem.count + 1
          }
        };
      }

      return {
        ...prev,
        [item.id]: { ...item, count: 1 }
      };

    });
  };
  const scheduleItemCount = (item_id, count) => {
    setSchedule((prev) => {
      // Если предмета вдруг нет (защита), возвращаем как было
      if (!prev[item_id]) return prev;

      return {
        ...prev,                 // Копируем весь старый список
        [item_id]: {             // Находим нужный ящик по ID
          ...prev[item_id],      // Копируем старые данные предмета (имя, иконку)
          count: count           // И перезаписываем ТОЛЬКО количество
        }
      };
    });
  };
  const scheduleItemDelete = (item_id) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev }; // Делаем копию объекта
      delete newSchedule[item_id];     // Удаляем ключ
      return newSchedule;              // Возвращаем обновленный объект
    });
  };
  return (
    <>

      <div className="container">
        <div className="item_search">
          <TextInput
            onChange={itemSearchChanged}
            initValue={itemSearch}
          />
        </div>
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

        <div className="search_list flex_rows">

          {searchList.map((item) => (
            <SearchItem
              key={item.id}
              item={item}
              className="search_item flex_row_left_center"
              onClick={() => searchItemClick(item)}
            />
          ))}

        </div>
        <div className="history_list">history_list</div>
        <div className="current_schedule">
          {Object.values(schedule).map((item) => (
            <ScheduleItem
              key={item.id}
              item={item}
              className="flex_row_left_center"
              onCount={scheduleItemCount}
              onDelete={scheduleItemDelete}
            />

          ))}

        </div>
        <div className="solution">solution</div>




        <div className="inventory_show flex_row_center_center">
          Inventory: {Object.keys(inventory || {}).length} item(s)
        </div>
        <div
          className="inventory_import flex_row_center_center"
          onClick={() => setInventoryImporting(true)}
        >
          <IconPng name="action018" alt="Import Inventory" />
          inventory_import</div>




        {inventoryImporting && <InvImport onClose={inventoryImportDone} />}

      </div>
    </>
  )
}

export default App;
