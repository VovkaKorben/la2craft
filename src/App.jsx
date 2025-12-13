import { useState, useEffect } from 'react'
import './assets/css/App.css';
import './assets/css/flex.css';
import './assets/css/import.css';
import './assets/css/vcl.css';
import './assets/css/drawer.css';
import TextInput from './comps/TextInput.jsx';
// import ButtonSelector from './comps/ButtonSelector.jsx';
import { API_BASE_URL, loadArrayFromLS, loadDataFromLS, isObject } from './utils.jsx';
import { IconPng } from './comps/IconPng.jsx';
import { SearchItem, ScheduleItem } from './comps/ListItems.jsx';
import { stringifyWithDepthLimit } from './debug.js';
import InvImport from './comps/InvImport.jsx';
import { Drawer } from './comps/Drawer.jsx';




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


    // inventory import/show -------------------------------------------
    const [inventory, setInventory] = useState(() => loadDataFromLS("inventory", []));
    const [inventoryImporting, setInventoryImporting] = useState(false);
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


    // schedule work -------------------------------------------
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
    const [scheduleClearVisible, setScheduleClearVisible] = useState(false);
    const scheduleClearAll = () => {
        setSchedule({}); // Просто обнуляем объект
    };

    // drawer -------------------------------------------
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

    // search results -------------------------------------------
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

    // solution update -------------------------------------------
    const [solution, setSolution] = useState(null);
    const SolutionLack = ({ data }) => {
        if (!data.length) return (<span className='large_text'>Nothing to show</span>);



        const rows = [];
        data.forEach((item) => {
            rows.push(
                <tr key={`lack-${item.item_id}`}>
                    <td className='icon_holder'><IconPng icon={item.icon} alt={item.item_name} /></td>
                    <td className='padl nw'>{item.item_name}</td>
                    <td className='pad ra nw'>{item.count.toLocaleString()}</td>
                </tr>);
        });






        return (<>

            <div className="div_header" >
                Lack table
            </div>

            <div className="div_scroll_area">
                <table><tbody>{rows}</tbody></table>
            </div>

        </>);


    }
    const SolutionCraft = ({ data }) => {
        if (!data.length) return (<span className='large_text'>Nothing to show</span>);
        const rows = [];
        // hdr
        rows.push(
            <tr key="craft-header">
                <th></th>
                <th className='padl la'>Recipe</th>
                <th className='pad ra'>Hits</th>
                <th className='pad ra'>Craft</th>
                <th className='pad ra'>Sum</th>
            </tr>);

        // rows
        let totalSum = 0;
        data.forEach((item, index) => {
            const rowSum = item.hits * item.price || 0;
            totalSum += rowSum;
            // console.log(item.item_id);
            rows.push(
                <tr key={`craft-${index}`}>
                    <td className='icon_holder'><IconPng icon={item.icon} alt={item.item_name} /></td>
                    <td className='padl nw'>
                        {item.item_name}
                        {item.level === 0 && <span className="dimmed padl">{item.chance}%</span>}
                    </td>
                    {/* <td className='padl'>{stringifyWithDepthLimit(item, 1)}</td> */}
                    <td className='pad ra'>{item.hits.toLocaleString()}</td>
                    <td className='pad ra'>{(item.hits * item.output).toLocaleString()}</td>
                    <td className='pad ra'>{(rowSum || "").toLocaleString()}</td>
                </tr>);
        });
        // footer
        rows.push(
            <tr key="craft-footer">
                <th colSpan={3} className='pad ra'>Total</th>

                <th className='pad ra'>{(totalSum || "").toLocaleString()}</th>
            </tr>);

        return (<>

            <div className="div_header" >
                Craft steps
            </div>

            <div className="div_scroll_area">
                <table><tbody>{rows}</tbody></table>
            </div>

        </>);

    }
    useEffect(() => {
        const handleCalculate = async () => {

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


        }

        handleCalculate();
    },
        [schedule, inventory, excludeState, useInventory]);







    // MAIN RENDER -------------------------------------------
    return (
        <>

            <div className="container"> <div className="site_logo">  </div>
                <div className="item_search">
                    <TextInput
                        onChange={itemSearchChanged}
                        initValue={itemSearch}
                        placeholder='Start typing for item search'
                    />
                </div>


                <div className="search_list div_scrollable div_border">
                    <div className="div_header" >
                        Search result
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

                <div className="schedule_list div_border div_scrollable"
                    onMouseEnter={() => setScheduleClearVisible(true)}
                    onMouseLeave={() => setScheduleClearVisible(false)}
                >
                    <div className="div_header" >
                        Current schedule
                        {scheduleClearVisible &&
                            <span
                                style={{ cursor: "pointer" }}
                                className='padl dimmed'
                                onClick={scheduleClearAll}>
                                Clear all
                            </span>

                        }
                    </div>
                    <div className="div_scroll_area">
                        {Object.values(schedule).map((item) => (
                            <ScheduleItem
                                key={item.id_mk}
                                item={item}

                                onCount={scheduleItemCount}
                                onDelete={scheduleItemDelete}
                            />

                        ))}
                    </div>
                </div>
                <div className="solution_lack div_border div_scrollable">
                    {solution && <SolutionLack data={solution.lack} />}
                </div>
                <div className="solution_craft div_border div_scrollable">
                    {solution && <SolutionCraft data={solution.craft} />}
                </div>



                <div className="cptr div_border flex_row_center_center"
                    onClick={() => setInventoryImporting(true)}
                >
                    <IconPng
                        icon="action018"
                        alt="Import Inventory"
                        style={{ marginRight: "10px" }}
                    />Inventory: {Object.keys(inventory || {}).length} item(s)
                </div>
                <div
                    onMouseMove={() => handleDrawerOpen(true)}
                    className="drawer_show"></div>
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                openChanged={handleDrawerOpen}
                state={excludeState}
                stateChanged={handleExcludeState}
            />
            {inventoryImporting && <InvImport className="div_border" onClose={inventoryImportDone} />}
        </>
    )
}

export default App;
