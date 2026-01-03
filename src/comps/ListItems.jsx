import { IconPng } from './IconPng.jsx';
import React, { useState, useEffect } from 'react'
import { prettify } from '../debug.js'
const DeleteButton = ({ onClick }) => {
    const handleClick = () => { if (onClick) onClick(); }
    return (<button className='red_cross' onClick={handleClick} title="Remove">✕</button>);
}
const ListItem = ({ left, right }) => {
    return (
        <div className='list_item'>
            <div className='list_item_left'>{left}</div>
            <div className='list_item_right' >{right}</div>
        </div>
    );
}


export const HistoryItem = ({ elem, onClick, onDelete }) => {
    const handleDelete = () => { if (onDelete) onDelete(); }

    const RenderItems = ({ items }) => {
        const r = [];
        for (let key in items) {
            r.push(
                <IconPng
                    // className="padr"
                    key={key}
                    icon={items[key].icon}
                    alt=''
                    count={2}
                />)
        }
        return <>{r}</>;

    }

    return (
        <ListItem
            left={<RenderItems items={elem.items} />}
            right={<DeleteButton />}


        />
        // 


        // ***{elem.time}***





    );
};


export const SearchItem = ({ item, onClick }) => {
    return (
        <ListItem
            onClick={onClick}
            left={
                <React.Fragment>
                    <IconPng className="padr" icon={item.icon} alt={item.item_name} />
                    {item.item_name}
                    <span className="dimmed padl">{item.success_rate}%</span>
                </React.Fragment >
            }
            right={<DeleteButton />}


        />

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
        <div className={`list_item flex_row_left_center ${className}`}        >
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
