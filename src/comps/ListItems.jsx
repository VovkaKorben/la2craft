import { IconPng } from './IconPng.jsx';
import { useState, useEffect } from 'react'
export const SearchItem = ({ item, className = "", onClick }) => {
    return (

        <div
            className={`${className}`}
            onClick={onClick}
        >
            <IconPng name={item.icon} alt={item.item_name} />
            {item.item_name}
            {item.variants_count > 1 &&
                <div className='rbox'>
                    {item.success_rate}%
                </div>}

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


    return (
        <div className={`schedule_item ${className}`}        >
            <IconPng name={item.icon} alt={item.item_name} />
            {item.item_name},{item.success_rate}%

            {/* <div                className="ed flex_row_right_center"            > */}
            <input
                type="number"
                value={item.count}
                onChange={handleCount}
                min={1}
                style={{ position: "absolute", right: "40px", }}

            />
            <button className='red_cross'
                onClick={handleDelete}
                style={{
                    right: "5px",
                    // border: "1px solid blue",
                   
                }}
                title="Стереть"
            >
                ✕
            </button> </div>
        // </div>

    );
};
