import React, { useEffect, useState, useRef, useMemo } from "react";


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
    const parsedCount = useMemo(() => {
        if (!importText) return 0;
        return importText.split(';').filter(item => item.trim().length > 0).length;
    }, [importText]);

    const readFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Просто заменяем текст в поле содержимым файла
            setImportText(e.target.result);
        };
        reader.readAsText(file);
    };
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Сначала проверяем
            if (validateFile(file)) {
                readFile(file);
            } else {
                // Если файл плохой - очищаем инпут, чтобы можно было выбрать другой
                e.target.value = '';
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggedOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            // Сначала проверяем
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
    const handleOK = () => {
        // Парсим данные
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
                        // Валидация: ID и Count должны быть числами
                        if (!isNaN(id) && !isNaN(count)) {
                            parsedItems[id] = count;
                        }
                    }
                });
        }

        // Передаем результат (пустой объект или заполненный) в onClose
        onClose(parsedItems);
    };
    const handleCancel = () => {
        // Передаем null, чтобы родитель понял, что это отмена
        onClose(null);
    };

    return (
        <div className="inventory_import_win">
            <div
                className="win_bg"
                onClick={handleCancel}
            ></div>

            <div className="win_content">

                <div className="win_part">
                    1. Download Adrenaline bot script here <a
                        target="_blank"            // <-- Исправлено (было _target)
                        rel="noopener noreferrer"  // <-- Безопасность
                        download                   // <-- Магия: браузер предложит сохранить файл
                        href="./adrenaline/get_inventory.txt">get_inventory.txt</a>
                </div>

                <div className=" win_part">
                    2. Run script, then its done - you will find a text file <b>inventory_result.txt</b> next to script.
                </div>



                <div className="flex_row_center_stretch">
                    <div className="win_part flex_col_center_top">
                        3a. Open the file <b>inventory_result.txt</b>, copy its contents, and put it in this field<br />
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                    </div>

                    <div
                        className="flex_row_center_center"
                        style={{ fontSize: "50px" }}>
                        OR
                    </div>


                    <div
                        onClick={() => inputFile.current.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onMouseEnter={() => setDraggedOver(true)}
                        onMouseLeave={() => setDraggedOver(false)}

                        style={{ cursor: 'pointer' }}
                        className={`flex_row_center_center win_part ${draggedOver ? "drag_over" : ""}`}

                    >

                        3b. Click here to specify file (you can just drop it here)
                        <input
                            type='file'
                            ref={inputFile}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                    </div>

                </div>




                <div id="import_hint" style={{ height: '20px', margin: '10px 0', fontWeight: 'bold' }}>
                    {/* Если есть ошибка — показываем её красным */}
                    {error && <span style={{ color: 'red' }}>⚠️ {error}</span>}

                    {/* Если ошибки нет, но есть товары — показываем количество зеленым */}
                    {!error && parsedCount > 0 && (
                        <span style={{ color: 'green' }}>Found items: {parsedCount}</span>
                    )}
                </div>

                <div>
                    <button
                        onClick={handleOK}
                        style={{ marginRight: "10px" }}>OK</button>
                    <button
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>


    );
};

export default InvImport;