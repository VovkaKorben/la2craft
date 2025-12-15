import { IconPng } from './IconPng.jsx';
import { useState, useEffect } from 'react'
export const SearchItem = ({ item, className = "", onClick }) => {
    return (

        <div
            className={`${className}`}
            onClick={onClick}
        >
            <IconPng className="padr" icon={item.icon} alt={item.item_name} />
            {item.item_name}
           

            <span className="dimmed padl">{item.success_rate}%</span>

        </div>
    );
};



export const ScheduleItem = ({ item, className = "", onCount, onDelete }) => {
    // const [count, setCount] = useState(item.count);
    const handleDelete = () => { if (onDelete) onDelete(item.id_mk); }

    const handleCount = (event) => {

        let val = parseInt(event.target.value);
        if (isNaN(val)) val = 1;
        const cleanValue = val < 1 ? 1 : val;
        if (onCount)
            onCount(item.id_mk, cleanValue);
    }
    //   className=" "

    return (
        <div className={`bc3 schedule_item flex_row_left_center ${className}`}        >
            <IconPng
                className="padr"
                icon={item.icon}
                alt={item.item_name}
            />
            {item.item_name}<span className='padl dimmed'>{item.success_rate}%</span>

            <div className="schedule_rbox"            >
                <input
                    type="number"
                    value={item.count}
                    onChange={handleCount}
                    min={1}
                    style={{}}

                />
                <button className='red_cross'
                    onClick={handleDelete}
                    style={{
                        right: "0px",
                        // border: "1px solid blue",

                    }}
                    title="Стереть"
                >
                    ✕
                </button>
            </div>
        </div>

    );
};
