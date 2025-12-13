import React, { useEffect, useState, useRef } from "react";


const TextInput = ({
    onChange,
    placeholder = "",
    initValue = null
}) => {
    const [value, setValue] = useState(initValue || "");
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(initValue || "");
    }, [initValue]);

    const handleInputChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);

        if (onChange) {
            onChange(newValue);
        }
    };

    const handleClear = () => {
        setValue("");
        if (onChange) {
            onChange("");
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        // <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}

            />   );

            {/* {value && (
                <button className='red_cross'
                    onClick={handleClear}
                    style={{
                        // marginLeft: "-35px",
right: "5px",
                    }}
                    title="Стереть"
                >
                    ✕
                </button>
            )}

   </div> */}

 
};

export default TextInput;