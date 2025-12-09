import { IconPng } from './IconPng.jsx';
import { useState, useEffect } from 'react'
export const SearchItem = ({ item, className = "", onClick }) => {
    return (
        // Если у компонента уже есть свой класс 'card', добавляем к нему внешний
        <div
            className={`${className}`}
            onClick={onClick}
        >
            <IconPng name={item.icon} alt={item.name} />
            {item.name}

        </div>
    );
};



export const ScheduleItem = ({ item, className = "", onCount, onDelete }) => {
    // const [count, setCount] = useState(item.count);
    const handleDelete = () => { if (onDelete) onDelete(item.id); }

    const handleCount = (event) => {

        let val = parseInt(event.target.value);
        if (isNaN(val)) val = 1;
        const cleanValue = val < 1 ? 1 : val;
        if (onCount)
            onCount(item.id, cleanValue);
    }


    return (
        <div className={`schedule_item ${className}`}        >
            <IconPng name={item.icon} alt={item.name} />
            {item.name}

            <div 
               
                className="ed flex_row_right_center"
            >
                <input
                    type="number"
                    value={item.count}
                    onChange={handleCount}
                    min={1}
                    style={{ width: "70px" }}

                />
                <button className='red_cross'
                    onClick={handleDelete}
                    style={{ marginLeft: "-5px" }}
                    title="Стереть"
                >
                    ✕
                </button> </div>
        </div>

    );
};
