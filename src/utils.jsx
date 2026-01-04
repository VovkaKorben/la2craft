// export const API_BASE_URL = 'http://localhost:3500/api/';

export const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3500/api/' : '/craft/api/';
export const HISTORY_TYPE = Object.freeze({
    MANUAL: 'manual',
    AUTO: 'auto'
});
export const HISTORY_LEN = Object.freeze({
    [HISTORY_TYPE.MANUAL]: 10, // Ключом станет строка 'manual'
    [HISTORY_TYPE.AUTO]: 5     // Ключом станет строка 'auto'
});
export const compare_item_sets = (set1, set2) => {
    // compare length
    if (Object.keys(set1).length !== Object.keys(set2).length)
        return false;
    // const id_mk_list = .sort((a, b) => {
    for (const id1 in set1) {
        if (!(id1 in set2))
            return false;
        if (set1[id1].count !== set2[id1].count)
            return false;
    }
    return true;
}

export const loadArrayFromLS = (key, expectedLength) => {
    try {
        const savedString = localStorage.getItem(key);

        // Если ничего нет — сразу возвращаем дефолт
        if (!savedString) return Array(expectedLength).fill(0);

        const parsed = JSON.parse(savedString);

        // САМАЯ ГЛАВНАЯ ПРОВЕРКА
        const isValid =
            Array.isArray(parsed) &&                     // 1. Это массив?
            parsed.length === expectedLength &&          // 2. Длина совпадает?
            parsed.every(val => val === 0 || val === 1); // 3. Внутри только 0 или 1?

        if (isValid) {
            return parsed;
        }
    } catch (e) {
        // Если JSON сломан (SyntaxError), просто игнорируем и вернем дефолт
        console.warn(`Ошибка чтения ключа ${key}:`, e);
    }

    // Если хоть одна проверка не прошла или была ошибка — возвращаем чистый массив
    return Array(expectedLength).fill(0);
};

// Простая загрузка для сложных данных (инвентарь, расписание)
export const loadDataFromLS = (key, defaultValue) => {
    try {
        // console.log(`loadDataFromLS: ${key}`);
        const savedString = localStorage.getItem(key);
        if (!savedString) return defaultValue;

        return JSON.parse(savedString);
    } catch (e) {
        console.warn(`Ошибка чтения ключа ${key}:`, e);
        return defaultValue;
    }
};

export function isObject(obj) {
    return typeof x === 'object' && !Array.isArray(x) && x !== null;
}


export function format_timediff(dt) {
    let d = (Date.now() - dt) / 1000;
    // seconds
    if (d < 60)
        return '<1m';

    // minutes
    d = Math.floor(d / 60);
    if (d < 60)
        return `${d}m`;

    // hours
    d = Math.floor(d / 60);
    if (d < 24)
        return `${d}h`;

    // days
    return `${d}d`;
}
