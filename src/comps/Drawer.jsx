import { useState, useEffect } from 'react';
import { IconPng } from './IconPng.jsx';
import { API_BASE_URL, loadDataFromLS } from '../utils.jsx';

export const Drawer = ({ isOpen, openChanged, state, stateChanged }) => {


    const [items, setItems] = useState([]);
    const [hint, setHint] = useState('');
    const handleHint = (item) => {

        setHint(`${item.name}\nPrice: ${item.price.toLocaleString()}`)
    }
    const handleClick = (item) => {
        let newState;
        if (state.includes(item.id_mk)) {
            newState = state.filter(id => id !== item.id_mk);
        } else {
            newState = [...state, item.id_mk];
        }
        stateChanged(newState);

    }


    useEffect(() => {
        const loadDrawerData = async () => {

            try {
                const resp = await fetch(`${API_BASE_URL}excludedids`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const result = await resp.json();
                if (resp.ok && result.success) {
                    setItems(result.data);
                } else {
                    console.error("Failed to load drawer data");
                }
            } catch (err) {
                console.error("Error loading drawer:", err);
            }
        };
        loadDrawerData();
    }, []);



    return (
        <div
            onMouseEnter={() => openChanged(true)}
            onMouseLeave={() => openChanged(false)}


            className={`bc1 oc3 drawer ${isOpen ? "opened_drawer" : ""}`}
        >
            Mark (highlight) the resources that you want to consider ready.<br />
            For example: if you select <i>Coarse Bone Powder</i>, <i>Animal Bone</i> will disappear from the list of required materials.
            < div className='drawerlist'>


                {items.map((item) => (
                    <IconPng
                        key={item.id_mk}
                        icon={item.icon}

                        onMouseEnter={() => handleHint(item)}
                        onMouseLeave={() => setHint('')}
                        onClick={() => handleClick(item)}
                        style={{ margin: "0px 1px 1px 0px" }}
                        className={state.includes(item.id_mk) ? "" : "op"}
                    />
                ))}


            </ div>
            < div className='drawerhint'>{hint}</ div>



        </ div>
    );
};