import React, { useState, useEffect } from 'react'
import { prettify } from '../debug.js'
import { API_BASE_URL, format_timediff, HISTORY_TYPE } from '../utils.jsx'


export const IconPng = ({ icon, count = 1, ...props }) => {
    const src = `./icon/${icon}.png`;



    const content = <img
        src={src}
        alt={icon}
        className="iconpng"
        style={{ borderRadius: "3px" }}
        {...props}
    />;

    // 2. Оборачиваем по условию
    if (count !== 1) {
        return <div className="iconcount_wrapper">
            {content}
            <img className="iconcount" src={`${API_BASE_URL}glyph?v=${count}`} alt='' />
        </div>;
    }

    return content;




};

const DeleteButton = ({ onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        if (onClick) onClick();
    }
    return (<button className='red_cross' onClick={handleClick} title="Remove">✕</button>);
}
const ListItem = ({ left, right, onClick, cursor, leftClass = '' }) => {
    return (
        <div
            onClick={onClick}
            className='list_item' style={{ cursor: cursor }}>
            {left && <div className={`list_item_left ${leftClass}`}>{left}</div>}
            {right && <div className='list_item_right' >{right}</div>}
        </div>
    );
}

const RenderHistoryItems = ({ items }) => {
    // sort keys by count, then by sort_order
    const id_mk_list = Object.keys(items).sort((a, b) => {
        const sort_result = items[b].count - items[a].count;
        if (sort_result === 0)
            return items[a].sort_order - items[b].sort_order
        return sort_result;
    });
    const row_items = [];
    id_mk_list.forEach((id_mk) =>
        row_items.push(
            <IconPng
                key={id_mk}
                icon={items[id_mk].icon}
                title={`${items[id_mk].item_name}, ${items[id_mk].success_rate}%`}
                alt=''
                count={items[id_mk].count}
            />)
    )
    return <>{row_items}</>;
}
export const HistoryItem = ({ elem, onClick, onDelete }) => {
    const handleDelete = () => {
        if (onDelete)
            onDelete(elem.time);
    }
    const handleClick = () => {
        if (onClick)
            onClick(elem.items);
    }




    return (
        <ListItem
            leftClass='history_fade'
            onClick={handleClick}
            cursor='alias'
            left={<RenderHistoryItems items={elem.items} />}
            right={
                <React.Fragment>
                    {elem.type === HISTORY_TYPE.AUTO && <span className='dimmed padr12'>auto</span>}
                    <span className='dimmed padr12'> {format_timediff(elem.time)}</span>
                    <DeleteButton onClick={handleDelete} />
                </React.Fragment>
            }


        />


    );
};


export const SearchItem = ({ item, onClick }) => {
    return (
        <ListItem
            onClick={onClick}
            cursor='copy'
            left={
                <React.Fragment>
                    <IconPng className="padr" icon={item.icon} alt={item.item_name} />
                    {item.item_name}
                    <span className="dimmed padl">{item.success_rate}%</span>
                </React.Fragment >
            }
        />
    );
};



export const ScheduleItem = ({ item, onCount, onDelete }) => {
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

        <ListItem
            style={{ cursor: 'copy' }}
            left={
                <React.Fragment>
                    <IconPng className="padr" icon={item.icon} alt={item.item_name} />
                    {item.item_name}
                    <span className="dimmed padl">{item.success_rate}%</span>
                </React.Fragment>
            }
            right={
                <React.Fragment>
                    <input type="number" value={item.count} onChange={handleCount} min={1} />
                    <DeleteButton onClick={handleDelete} />
                </React.Fragment>
            }


        />



    );
};
