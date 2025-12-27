import React, { useEffect, useState, useRef, useMemo } from "react";
import { PASCAL_SCRIPT_TEMPLATE } from '../adrenalineScript';
const AUTO_INV_SCRIPT_FILENAME = 'auto_inv.txt';
const downloadScriptWithGuid = (e) => {
    e.preventDefault(); // Чтобы страница не прыгала вверх
    // 1. Получаем или создаем GUID
    let guid = localStorage.getItem('user_guid');
    if (!guid) {
        guid = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        localStorage.setItem('user_guid', guid);

    }
    console.log(`guid: ${guid}`);
    const finalScript = PASCAL_SCRIPT_TEMPLATE.replace('{{CUSTOM_GUID}}', guid);

    // 3. Создаем "виртуальный" файл и качаем его
    const blob = new Blob([finalScript], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = AUTO_INV_SCRIPT_FILENAME;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // document.body.appendChild(link); // Временно добавляем в документ для надежности
    link.click();
    // document.body.removeChild(link);

    URL.revokeObjectURL(url);
    // setTimeout(() => URL.revokeObjectURL(url), 1000);

}
const InvImport = ({
    onClose
}) => {
    // Константы ограничений
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ в байтах
    const ALLOWED_EXTENSIONS = ['txt'];     // Разрешенные расширения

    const inputFile = useRef(null);
    const [importText, setImportText] = useState("");
    const [draggedOver, setDraggedOver] = useState(false);
    const [error, setError] = useState(""); // Стейт для текста ошибки
    const validateFile = (file) => {
        setError(""); // Сбрасываем старые ошибки

        // 1. Проверка размера
        if (file.size > MAX_FILE_SIZE) {
            setError(`Файл слишком большой! Максимум ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            return false;
        }

        // 2. Проверка расширения (берем имя файла, делим по точке, берем хвост)
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            setError("Неверный формат! Нужен только .txt");
            return false;
        }

        return true;
    };

    const [files, setFiles] = useState([]);
    // const inputFile = useRef(null);

    const readFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImportText(e.target.result);
        };
        reader.readAsText(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (validateFile(file)) {
                readFile(file);
            } else {
                e.target.value = '';
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggedOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            if (validateFile(file)) {
                readFile(file);
            }
        }
    };




    const handleDragOver = (e) => {
        e.preventDefault();
        setDraggedOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDraggedOver(false);
    };

    const parseInput = () => {
        const parsedItems = {};

        if (importText.trim()) {
            importText
                .split(';')
                .filter(Boolean)
                .forEach(entry => {
                    const parts = entry.split(',');
                    if (parts.length >= 2) {
                        const id = parseInt(parts[0]);
                        const count = parseInt(parts[1]);

                        if (!isNaN(id) && !isNaN(count)) {
                            if (!(id in parsedItems))
                                parsedItems[id] = 0;
                            parsedItems[id] += count;
                        }
                    }
                });
        }
        return parsedItems;
    }

    const parsedCount = useMemo(() => {
        return Object.keys(parseInput()).length;

    }, [importText]);

    const handleOK = () => {
        onClose(parseInput());
    };
    const handleCancel = () => {
        onClose(null);
    };

    return (
        <div className="inventory_import_win">
            <div className="win_bg" onClick={handleCancel}            ></div>

            <div className="bc3 win_content">
                {/* STANDARD header*/}
                <div className="fntl">
                    Standard import
                </div>

                {/* STANDARD download*/}
                <div className="div_border padi">
                    1. Download script for Adrenaline-bot here <a target="_blank" rel="noopener noreferrer" download href="./adrenaline/get_inventory.txt">get_inventory.txt</a>
                </div>

                <div className="div_border padi">
                    2. Run script, then its done - you will find a text file <code>inventory_result.txt</code> next to script.
                </div>

                {/* HOLDER */}
                <div style={{ height: "100%", display: "flex", flexDirection: "row", gap: "10px" }}                >
                    {/* LEFT */}
                    <div className="div_border padi" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}                    >
                        <div>3a. Open the file <i>inventory_result.txt</i>, copy its contents, and paste it in this field</div><br />
                        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} style={{ width: "100%", height: "100%", resize: "none", minHeight: "60px" }} />
                    </div>
                    {/* CENTER */}
                    <div className="large_text" style={{ flex: "0 0 100px", width: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}                    >
                        OR
                    </div>
                    {/* DROPDOWN AREA */}
                    <div
                        onClick={() => inputFile.current.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onMouseEnter={() => setDraggedOver(true)}
                        onMouseLeave={() => setDraggedOver(false)}
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer', display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}
                        className={`padi flex_c  div_border ${draggedOver ? "drag_over" : ""}`}
                    >
                        3b. Click here to specify file (you can just drop it here)
                        <input type='file' ref={inputFile} style={{ display: 'none' }} onChange={handleFileSelect} />
                    </div>
                </div>
                {/* AUTO INV header*/}
                <div className="fntl">
                    Experimental - automatic import
                </div>

                {/* AUTO INV */}
                <div className="div_border padi">
                    This script is unique for each download.<br />
                    <a href="#download" onClick={downloadScriptWithGuid}>{AUTO_INV_SCRIPT_FILENAME}</a>

                </div>

                <div id="import_hint" style={{ height: '20px', margin: '10px 0', fontWeight: 'bold' }}>
                    {error && <span style={{ color: 'red' }}>⚠️ {error}</span>}
                    {!error && parsedCount > 0 && (
                        <span style={{ color: 'green' }}>Found items: {parsedCount}</span>
                    )}
                </div>

                <div>
                    <button
                        onClick={handleOK}
                        className="normal"
                        style={{ marginRight: "10px" }}>OK</button>
                    <button
                        onClick={handleCancel}
                        className="normal"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div >


    );
};

export default InvImport;