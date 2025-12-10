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