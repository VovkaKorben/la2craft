import React, { useEffect, useState } from "react";


const ButtonSelector = ({
    onChange,
    initValue,
    type
}) => {

    let itemCount = 0;
    if (type === "type") {
        itemCount = 3;
    } else if (type === "grade") {
        itemCount = 5;
    };

    const [values, setValues] = useState(() => {
        return initValue || Array(itemCount).fill(0);
    });



    if (!itemCount)
        return <div style={{ color: 'red' }}>Invalid type</div>;

    const handleToggle = (index) => {
        const newValues = [...values];
        newValues[index] = 1 - newValues[index];
        setValues(newValues);
        if (onChange) {
            onChange(newValues);
        }
    };


    return (
        <div className="button-selector" style={{ display: "flex" }}>

            {values.map((isActive, index) => (
                <div
                    key={index}
                    onClick={() => handleToggle(index)}
                >
                    <img

                        src={`./ui/${type}_${index}.png`}
                        alt=""

                        className={isActive ? "" : "transp"}
                    />
                </div>

            ))}

        </div>
    );
};

export default ButtonSelector;


/*
const handleInputChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);

        if (onChange) {
            onChange(newValue);
        }
    };*/