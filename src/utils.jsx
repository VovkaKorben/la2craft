export const  loadArrayFromLS = (key, expectedLength) => {
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