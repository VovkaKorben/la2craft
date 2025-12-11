export const createSmartDict = (initialData = {}) => {
    return new Proxy({ ...initialData }, {
        // 1. ПЕРЕХВАТ ЧТЕНИЯ (GET)
        // Чтобы aaaa[5] -= 2 не давало NaN, если ключа нет
        get(target, prop) {
            // Если пытаемся прочитать свойство для JSON или итерации — отдаем как есть
            if (prop === Symbol.iterator || prop === 'toJSON') {
                return target[prop];
            }

            // Если ключа нет, возвращаем 0 (вместо undefined). 
            // Это позволяет писать dict[5] += 10 для пустых ключей!
            return Reflect.get(target, prop) || 0;
        },

        // 2. ПЕРЕХВАТ ЗАПИСИ (SET)
        // Срабатывает при aaaa[5] = ... или aaaa[5] -= ...
        set(target, prop, value) {
            // Если пытаемся записать 0 или меньше — удаляем ключ
            if (typeof value === 'number' && value <= 0) {
                delete target[prop];
                return true; // Операция успешна
            }

            // Иначе записываем как обычно
            target[prop] = value;
            return true;
        }
    });
};


export const createSmartDict2 = (initialData = {}) => {
    return new Proxy({ ...initialData }, {
        
        // ПЕРЕХВАТ ЧТЕНИЯ (GET)
        get(target, prop) {
            // 1. Пропускаем системные вызовы
            // React и JS часто проверяют 'toJSON', 'toString', 'then' (для промисов) или итераторы.
            // Если вернуть им 0, приложение может упасть.
            if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
                return Reflect.get(target, prop);
            }

            // 2. Главная магия
            // Если ключ есть — отдаем значение.
            // Если ключа нет — отдаем 0 (вместо undefined).
            return (prop in target) ? target[prop] : 0;
        }
        
        // SET убрали намеренно!
        // Теперь можно писать: dict[id] -= 100
        // И если было 0, станет -100 (наш Lack). И ключ сохранится.
    });
};