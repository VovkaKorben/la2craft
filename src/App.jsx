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
import { stringifyWithDepthLimit } from './debug.js';
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
  const [solution, setSolution] = useState(null);

  useEffect(() => { localStorage.setItem("itemSearch", itemSearch); }, [itemSearch]);
  useEffect(() => { localStorage.setItem("filterType", JSON.stringify(filterType)); }, [filterType]);
  useEffect(() => { localStorage.setItem("filterGrade", JSON.stringify(filterGrade)); }, [filterGrade]);
  useEffect(() => { localStorage.setItem('schedule', JSON.stringify(schedule)); }, [schedule]);


  // search update
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


  // solution update
  const SolutionLack = ({ data }) => {

    const rows = [];
    data.forEach((item) => {
      rows.push(
        <tr key={item.item_id}>
          <td><IconPng name={item.icon} alt={item.item_name} /></td>
          <td className='padl'>{item.item_name}</td>
          <td className='pad ra'>{item.count.toLocaleString()}</td>
        </tr>);
    });


    return <>Lack<table><tbody>{rows}</tbody></table></>;


  }
  const SolutionCraft = ({ data }) => {
    const rows = [];
    // hdr
    rows.push(
      <tr key="craft-header">
        <th></th>
        <th className='padl la'>Recipe</th>
        <th className='pad ra'>Count</th>
        <th className='pad ra'>Sum</th>
      </tr>);

    // rows
    let totalSum = 0;
    data.forEach((item) => {
      const rowSum = item.count * item.price || 0;
      totalSum += rowSum;

      rows.push(
        <tr key={item.item_id}>
          <td><IconPng name={item.icon} alt={item.item_name} /></td>
          <td className='padl'>{item.item_name}</td>
          <td className='pad ra'>{item.count.toLocaleString()}</td>
          <td className='pad ra'>{(rowSum || "").toLocaleString()}</td>
        </tr>);
    });
    // footer
    rows.push(
      <tr key="craft-footer">
        <th colSpan={3} className='pad ra'>Total</th>

        <th className='pad ra'>{(totalSum || "").toLocaleString()}</th>
      </tr>);

    return (<>Craft<table><tbody>{rows}</tbody></table></>);
  }

  useEffect(() => {
    const handleCalculate = async () => {

      const resp = await fetch(`${API_BASE_URL}solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          inventory: false ? inventory : [],
          schedule: schedule,
          use_composite: false,
        })
      });

      const result = await resp.json();
      if (resp.ok && result.success) {

        setSolution(result.data);

      } else {
        //setSolution(<><b><u>craft error:</u></b><br /> {result.error}</>);
      }


    }

    handleCalculate();
  },
    [schedule, inventory]);



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
      const existingItem = prev[item.id_mk];

      if (existingItem) {
        return {
          ...prev,
          [item.id_mk]: {
            ...existingItem,
            count: existingItem.count + 1
          }
        };
      }

      return {
        ...prev,
        [item.id_mk]: { ...item, count: 1 }
      };

    });
  };
  const scheduleItemCount = (id_mk, count) => {
    setSchedule((prev) => {
      // Если предмета вдруг нет (защита), возвращаем как было
      if (!prev[id_mk]) return prev;

      return {
        ...prev,                 // Копируем весь старый список
        [id_mk]: {             // Находим нужный ящик по ID
          ...prev[id_mk],      // Копируем старые данные предмета (имя, иконку)
          count: count           // И перезаписываем ТОЛЬКО количество
        }
      };
    });
  };
  const scheduleItemDelete = (id_mk) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev }; // Делаем копию объекта
      delete newSchedule[id_mk];     // Удаляем ключ
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


        <div className="search_list flex_cols">

          {searchList.map((item) => (
            <SearchItem
              key={item.id_mk}
              item={item}
              className="search_item flex_row_left_center"
              onClick={() => searchItemClick(item)}
            />
          ))}

        </div>
        <div className="history_list">history_list</div>
        <div className="schedule_list">
          {Object.values(schedule).map((item) => (
            <ScheduleItem
              key={item.id_mk}
              item={item}
              className="flex_row_left_center"
              onCount={scheduleItemCount}
              onDelete={scheduleItemDelete}
            />

          ))}

        </div>
        <div className="solution_lack">
          {solution && <SolutionLack data={solution.lack} />}
        </div>
        <div className="solution_craft">
          {solution && <SolutionCraft data={solution.craft} />}
        </div>



        <div
          className="inventory_show flex_row_center_center"
          onClick={() => setInventoryImporting(true)}
        >
          <IconPng
            name="action018"
            alt="Import Inventory"
            style={{ marginRight: "10px" }}
          />Inventory: {Object.keys(inventory || {}).length} item(s)
        </div>
      </div>
      {inventoryImporting && <InvImport onClose={inventoryImportDone} />}
    </>
  )
}

export default App;
