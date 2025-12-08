import React, { useEffect, useState, useRef } from "react";


const InvImport = ({
    onClose
}) => {

    const [files, setFiles] = useState([]);
    const inputFile = useRef(null);

    const handleFileLoad = (e) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (onChange) {
            onChange(newValue);
        }
    };



    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(droppedFiles);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="inventory_import_win">
            <div className="win_bg"></div>

            <div className="win_content">

                <div className="flex_row_center_center win_part">
                    1. Download Adrenaline bot script here *LINK*
                </div>
                <div className="flex_row_center_center win_part">
                    2. Run script, after the script runs, you will find a text file *filename* next to it.
                </div>
                <div className=" win_part">
                    3a. Open the file, copy its contents, and put it in this field<br />
                    <textarea />
                </div>
                <span style={{ fontSize: "50px" }}>OR</span>
                <div
                    onClick={() => inputFile.current.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="flex_row_center_center win_part"
                >
                    {files.map((file, index) => (
                        <li key={index}>{file.name}</li>
                    ))}e
                    3b. Click here to specify file (you can just drop it here)
                    <input type='file' id='file' ref={inputFile} style={{ display: 'none' }} />
                    {/* <input type='file' id='file' ref={inputFile} /> */}
                </div>
                <span id="import_hint">import_hint</span>
                <div>
                    <button style={{ marginRight: "10px" }}>OK</button>
                    <button>Cancel</button>
                </div>
            </div>
        </div>


    );
};

export default InvImport;