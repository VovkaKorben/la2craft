import React, { useState, useEffect, useMemo } from 'react'
import './assets/css/App.css';
import './assets/css/flex.css';
import './assets/css/import.css';
import './assets/css/vcl.css';
import './assets/css/drawer.css';
import './assets/css/listitems.css';
import './assets/css/common.css';
import './assets/css/tooltip.css';
import TextInput from './comps/TextInput.jsx';
// import ButtonSelector from './comps/ButtonSelector.jsx';
import { compare_item_sets, API_BASE_URL, loadArrayFromLS, loadDataFromLS, isObject, HISTORY_TYPE, HISTORY_LEN } from './utils.jsx';

import { IconPng, SearchItem, ScheduleItem, HistoryItem } from './comps/ListItems.jsx';
import { prettify } from './debug.js';
import InvImport from './comps/InvImport.jsx';
import { Drawer } from './comps/Drawer.jsx';
import { io } from 'socket.io-client';


const SOCKET_URL = import.meta.env.DEV
    ? 'http://localhost:49999'
    : 'https://mariko.dev'; // Указываем основной домен

const aa_items = {
    2133: 30000,
    2134: 100000,
    1461: 15000,
    1462: 25000
}
const gems = { // D-C-B
    2130: 1200,
    2131: 3600,
    2132: 12000
}

const SolutionLack = ({ data }) => {

    const rows = useMemo(() => {
        if (!data.length) return [];

        let aa_total = 0, gems_total = 0;
        const resultRows = [];

        data.forEach((item) => {
            const aa_current = item.item_id in aa_items ? aa_items[item.item_id] * item.count : 0;
            aa_total += aa_current;

            const gems_current = item.item_id in gems ? gems[item.item_id] * item.count : 0;
            gems_total += gems_current;

            resultRows.push(
                <tr key={`lack-${item.item_id}`}>
                    <td className='icon_holder'><IconPng icon={item.icon} alt={item.item_name} /></td>
                    <td className='pad-txt  nw'>
                        <a className='itemlink' href={`https://lineage.pmfun.com/item/${item.item_id}/?sort=chance`} target="_blank">
                            {item.item_name}
                        </a>

                        {aa_current !== 0 && (
                            <span className="dimmed padl">
                                {aa_current.toLocaleString()} AA
                            </span>
                        )}
                        {gems_current !== 0 && (
                            <span className="dimmed padl">
                                {gems_current.toLocaleString()} a
                            </span>
                        )}

                    </td>
                    <td className='pad-num  ra nw'>{item.count.toLocaleString()}</td>
                </tr>);
        });

        if (aa_total)
            resultRows.push(
                <tr key="lack-aa" >
                    <td className='icon_holder'><IconPng icon="etc_ancient_adena_i00" alt="AA" /></td>
                    <td className='dimmed padl nw'>Ancient Adena</td>
                    <td className='dimmed pad-num  ra nw'>{aa_total.toLocaleString()}</td>
                </tr>);

        if (gems_total)
            resultRows.push(
                <tr key="lack-adena" >
                    <td className='icon_holder'><IconPng icon="etc_adena_i00" alt="Adena" /></td>
                    <td className='dimmed padl nw'>Gems price</td>
                    <td className='dimmed pad-num  ra nw'>{gems_total.toLocaleString()}</td>
                </tr>);
        return resultRows;
    }, [data]); // Пересчитываем только если изменился solution.lack
    if (!data.length) return (<div className='large_text'>Nothing to show</div>);

    return (<>
        <div className='div_header' >
            <span>Lack table</span>

            <div className="tooltip-container">
                <img
                    src="./ui/info.svg"
                    alt="info"
                    className='icon-fix dimmed curptr'
                />
                <div className="tooltip">This table contains a list of missing resources.<br />If the Use inventory checkbox is enabled,<br />then this is taken into account in the table.</div>
            </div>
        </div>
        <div className="div_scroll_area">
            <table style={{ marginLeft: '16px', marginRight: "16px" }}>
                <tbody>{rows}</tbody></table>
        </div>

    </>);


}
const SolutionCraft = ({ data }) => {
    const { rows, totalSum } = useMemo(() => {
        if (!data.length) return { rows: [], totalSum: 0 };
        const resultRows = [];

        // hdr
        resultRows.push(
            <tr key="craft-header">
                <th></th>
                <th className='padl la'>Recipe</th>
                <th className='pad-num ra'>Hits</th>
                <th className='pad-num ra'>Count</th>
                <th className='pad-num ra'>Sum</th>
            </tr>);

        // rows
        let currentSum = 0;
        data.forEach((item, index) => {
            const rowSum = item.hits * item.price || 0;
            currentSum += rowSum;
            // console.log(item.item_id);
            resultRows.push(
                <tr key={`craft-${index}`}>
                    <td className='icon_holder'><IconPng icon={item.icon} alt={item.item_name} /></td>
                    <td className='pad-txt  nw'>
                        {item.item_name}
                        {item.level === 0 && <span className="dimmed padl">{item.chance}%</span>}
                    </td>
                    {/* <td className='padl'>{stringifyWithDepthLimit(item, 1)}</td> */}
                    <td className='pad-num  ra'>{item.hits.toLocaleString()}</td>
                    <td className='pad-num  ra'>{(item.hits * item.output).toLocaleString()}</td>
                    <td className='pad-num  ra'>{(rowSum || "").toLocaleString()}</td>
                </tr>);
        });

        // footer
        resultRows.push(
            <tr key="craft-footer">
                <th colSpan={4} className='pad-num  ra'>Total sum</th>
                <th className='pad-num  ra'>{(currentSum || "").toLocaleString()}</th>
            </tr>);
        return { rows: resultRows, totalSum: currentSum };
    }, [data]);
    if (!data.length) return (<div className='large_text'>Nothing to show</div>);
    return (<>

        <div className='div_header' >
            <span>Craft steps</span>
            <div className="tooltip-container">
                <img
                    src="./ui/info.svg"
                    alt="info"
                    className='icon-fix dimmed curptr'
                />
                <div className="tooltip">Craft resources sequentially,<br />from top to bottom of the list.</div>
            </div>
        </div>
        <div className="div_scroll_area">
            <table style={{ marginLeft: '16px', marginRight: "16px" }}><tbody>{rows}</tbody></table>
        </div>

    </>);

}

function App() {
    // inventory use checkbox -------------------------------------------
    const [useInventory, setUseInventory] = useState(() => {
        const saved = localStorage.getItem('useInventory');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        return true;
    });
    const handleUseInventoryChange = () => {
        const newValue = !useInventory;
        setUseInventory(newValue);
        localStorage.setItem('useInventory', JSON.stringify(newValue));
    }


    // AUTO INVENTORY
    const [userGuid, setUserGuid] = useState(() => localStorage.getItem('user_guid'));
    const [lastUpdate, setLastUpdate] = useState(null); // Время в миллисекундах
    const [timeAgo, setTimeAgo] = useState("");

    useEffect(() => {

        if (!userGuid) return;

        const socket = io(SOCKET_URL, {
            path: '/inventory/socket.io', // Явно говорим использовать наш спец-путь
            query: { guid: userGuid },
            transports: ['websocket']
        });


        // Ловим событие 'inventory_new'
        socket.on('inventory_new', (buffer) => {
            // buffer — это пришедший массив байтов (8 байт на предмет: 4 id + 4 count)
            const view = new DataView(buffer);
            const items = {};

            for (let i = 0; i < view.byteLength; i += 8) {
                const id = view.getUint32(i, true);      // 4 байта ID
                const count = view.getUint32(i + 4, true); // 4 байта количество
                items[id] = count;

            }

            // Обновляем основной инвентарь через вашу функцию
            inventoryImportDone(items);

            // Обновляем дебаг-панель для Барина
            // setDebugRawData(`Получено предметов: ${items.length} (Время: ${new Date().toLocaleTimeString()})`);
            setLastUpdate(Date.now());
        });

        return () => socket.disconnect(); // Чистим за собой при выходе
    }, [userGuid]);

    useEffect(() => {
        if (!lastUpdate) return;

        const updateLabel = () => {
            const diffInMinutes = Math.floor((Date.now() - lastUpdate) / 60000);
            if (diffInMinutes < 1) setTimeAgo("<1m");
            else setTimeAgo(`${diffInMinutes}m`);
        };

        updateLabel(); // Обновляем сразу
        const timer = setInterval(updateLabel, 30000); // И проверяем каждые 30 секунд
        return () => clearInterval(timer);
    }, [lastUpdate]);
    // inventory import/show -------------------------------------------
    const [inventory, setInventory] = useState(() => loadDataFromLS("inventory", []));
    const [inventoryImporting, setInventoryImporting] = useState(false);
    const inventoryImportDone = (incomingData) => {
        setInventoryImporting(false);
        // 2. Проверяем: если пришел НЕ null, значит нажали OK и данные есть
        if (incomingData !== null) {
            // console.log("Импортировано:", incomingData);

            // 3. Обновляем стейт
            setInventory(incomingData);

            // 4. Важный момент: Сохранение в LocalStorage
            // Если у вас нет useEffect, который следит за inventory, сохраните вручную тут:
            localStorage.setItem("inventory", JSON.stringify(incomingData));
        } else {
            console.log("Импорт отменен пользователем");
        }


    };


    // schedule work -------------------------------------------
    // add to schedule
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

            const unsorted_schedule = {
                ...prev,
                [item.id_mk]: { ...item, count: 1 }
            };
            return unsorted_schedule

        });
    };
    const [schedule, setSchedule] = useState(() => {
        const saved = localStorage.getItem('schedule');
        return saved ? JSON.parse(saved) : {};
    });
    useEffect(() => { localStorage.setItem('schedule', JSON.stringify(schedule)); }, [schedule]);
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
    // clear schedule flag and handler
    const [scheduleClearVisible, setScheduleClearVisible] = useState(false);



    // schedule sort for render

    const sortedSchedule = useMemo(() => {
        // 1. Превращаем словарь в массив
        return Object.values(schedule).sort((a, b) => {
            // 2. Сортируем
            // Если sort_order вдруг нет (undefined), ставим 999999, чтобы улетел в конец
            const orderA = a.sort_order !== undefined ? a.sort_order : 999999;
            const orderB = b.sort_order !== undefined ? b.sort_order : 999999;

            return orderA - orderB; // От меньшего к большему
        });
    }, [schedule]); // Пересчитываем только если изменился сам schedule

    // DRAWER -------------------------------------------
    const [excludeState, setExcludeState] = useState(() => loadDataFromLS('excludeState', []));
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const handleDrawerOpen = (value) => { setDrawerOpen(value); }
    const handleExcludeState = (newData) => {
        setExcludeState(newData);

    }
    useEffect(() => {
        localStorage.setItem("excludeState", JSON.stringify(excludeState));
    }, [excludeState]);

    // search update -------------------------------------------
    const [itemSearch, setItemSearch] = useState(localStorage.getItem("itemSearch") || "");
    const [searchList, setSearchList] = useState([]);
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

        localStorage.setItem("itemSearch", itemSearch);
        const data = {
            substr: itemSearch
        }

        handleSearch(data);
    }, [itemSearch]);
    const itemSearchChanged = (value) => { setItemSearch(value); }



    // solution update -------------------------------------------
    const [solution, setSolution] = useState(null);

    useEffect(() => {
        const handleCalculate = async () => {
            // console.time("Server calculation"); // Начало замера
            const resp = await fetch(`${API_BASE_URL}solution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({
                    inventory: useInventory ? inventory : [],
                    schedule: schedule,
                    excluded: excludeState,
                })
            });
            const result = await resp.json();
            if (resp.ok && result.success) {

                setSolution(result.data);

            } else {
                //setSolution(<><b><u>craft error:</u></b><br /> {result.error}</>);
            }
            // console.timeEnd("Server calculation"); // В консоли появится время в мс

        }

        handleCalculate();
    },
        [schedule, inventory, excludeState, useInventory]);



    // HISTORY -------------------------------------------
    const [historyVisible, setHistoryVisible] = useState(false);
    const [history, setHistory] = useState(loadDataFromLS('history', []));
    const historyAdd = ({ items, type }) => {
        if (Object.keys(items).length > 0) {
            setHistory((prev) => {
                // search same items
                let found = prev.findIndex((existing_set) => compare_item_sets(existing_set.items, items));

                let new_items = [...prev];
                if (found >= 0) {
                    // override incoming type 
                    if ((new_items[found].type === HISTORY_TYPE.MANUAL) && (type === HISTORY_TYPE.AUTO)) {
                        type = HISTORY_TYPE.MANUAL;
                    }
                    // set already exists, cut it off
                    new_items.splice(found, 1);
                }
                // append element
                new_items.unshift({ items: items, type: type, time: Date.now() });


                // check for count limit for specified type
                if (new_items.filter((item) => item.type === type).length > HISTORY_LEN[type]) {
                    // console.log(`check for count limit for specified type: ${HISTORY_LEN[type]}`);
                    const oldest_index = new_items.findLastIndex((item) => item.type === type);
                    // console.log(`oldest_index: ${oldest_index}`);
                    new_items.splice(oldest_index, 1);
                }
                return new_items;
            });
        }
    }
    useEffect(() => {
        localStorage.setItem('history', JSON.stringify(history));
    }, [history]);
    const historyAddManual = () => {
        historyAdd({ items: schedule, type: HISTORY_TYPE.MANUAL })
    }
    const handleHistoryClick = (elems) => {
        // alert(`handleHistoryClick`);
        historyAdd({ items: schedule, type: HISTORY_TYPE.AUTO });
        setSchedule(elems);
        setHistoryVisible(false);

    }
    const handleHistoryDelete = (elem_time) => {
        setHistory(prev => prev.filter(item => item.time !== elem_time));
    }
    const scheduleClearAll = () => {
        if (Object.keys(schedule).length)
            historyAdd({ items: schedule, type: HISTORY_TYPE.AUTO });
        setSchedule({});
    };


    // MAIN RENDER -------------------------------------------
    return (
        <>

            <div className="container">

                <div className="site_logo flex_c" >
                    <a href="https://l2cat.net/" target="_blank"> <img src="./img/logo2.png" alt="" /></a>
                </div>

                <div className="item_search">
                    <TextInput
                        onChange={itemSearchChanged}
                        initValue={itemSearch}
                        placeholder='Start typing for item search'
                    />
                </div>


                <div className="search_list div_scrollable div_border">
                    <div className="div_header" >
                        Search result:
                        <span className='padl dimmed'>{searchList.length} item(s)</span>
                    </div>
                    <div className="div_scroll_area">
                        {searchList.map((item) => (
                            <SearchItem
                                key={item.id_mk}
                                item={item}
                                className="bc3 search_item flex_row_left_center"
                                onClick={() => searchItemClick(item)}
                            />
                        ))}
                    </div>
                </div>

                <div className="solution_options div_border flex_c">


                    <label className="checkbox-wrapper">
                        <input
                            checked={useInventory}
                            onChange={handleUseInventoryChange}
                            // onChange={() => setChecked(!checked)}
                            type="checkbox"
                            className="hidden-input" />
                        <span className="custom-box"></span>
                        <span className="label-text">Use inventory</span>
                    </label>


                </div>
                {/* SCHEDULE */}
                <div className="schedule_list div_border div_scrollable"
                    onMouseEnter={() => setScheduleClearVisible(true)}
                    onMouseLeave={() => {
                        setScheduleClearVisible(false);
                        setHistoryVisible(false);
                    }}>

                    {/* HISTORY CONTROLS */}
                    <div className="div_header" >
                        {historyVisible ? 'History:' : 'Current schedule:'}
                        {!historyVisible && scheduleClearVisible && <span className='curptr padl dimmed' onClick={scheduleClearAll}>Clear all</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', paddingRight: '10px' }}>
                            {!historyVisible &&
                                <React.Fragment>
                                    <img onClick={historyAddManual} className="icon-fix dimmed curptr" src="./ui/bookmark_add.svg" alt="add bm" />
                                    <img onMouseEnter={() => setHistoryVisible(true)} className="icon-fix dimmed curptr" src="./ui/bookmark_list.svg" alt="list bm" />
                                </React.Fragment>
                            }
                        </div>
                    </div>





                    <div className="div_scroll_area">

                        {/* HISTORY LIST */}

                        {historyVisible && (
                            history.length > 0
                                ? history.map((elem) => (
                                    <HistoryItem
                                        key={elem.time}
                                        elem={elem}
                                        onClick={handleHistoryClick}
                                        onDelete={handleHistoryDelete}
                                    />
                                ))
                                : <div className="large_text">History empty</div>
                        )}



                        {/* SCHEDULE LIST */}
                        {!historyVisible &&
                            sortedSchedule.map((item) => (
                                <ScheduleItem
                                    key={item.id_mk}
                                    item={item}
                                    onCount={scheduleItemCount}
                                    onDelete={scheduleItemDelete}
                                />
                            ))

                        }

                    </div>
                </div>
                <div className="solution_lack div_border div_scrollable">
                    {solution &&
                        <SolutionLack data={solution.lack} />
                    }
                </div>
                <div className="solution_craft div_border div_scrollable">
                    {solution &&
                        <SolutionCraft data={solution.craft} />
                    }
                </div>


                {/* INV IMPORT */}
                <div className="curptr div_border flex_row_center_center padi" onClick={() => setInventoryImporting(true)}                                    >

                    <IconPng icon="action018" alt="Import Inventory" style={{ marginRight: "10px" }} />
                    <div className='flex_col_left_center'>
                        <div> Inventory: {Object.keys(inventory || {}).length} item(s)</div>
                        {lastUpdate && (
                            <div className="dimmed">last updated: {timeAgo} ago</div>
                        )}

                    </div>
                </div>

                <div
                    onMouseMove={() => handleDrawerOpen(true)}
                    className="drawer_show"></div>
            </div >

            <Drawer
                isOpen={isDrawerOpen}
                openChanged={handleDrawerOpen}
                state={excludeState}
                stateChanged={handleExcludeState}
            />



            {inventoryImporting && <InvImport className="div_border" onClose={inventoryImportDone} onGuidCreated={setUserGuid} />}

        </>
    )
}

export default App;
