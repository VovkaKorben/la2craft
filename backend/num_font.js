import { createCanvas, loadImage } from 'canvas';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs'; // Добавляем встроенный модуль для проверки файлов

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GLYPH_CONFIG = {
    width: 9,
    height: 9,
    nums: [7, 6, 7, 7, 7, 7, 7, 7, 7, 7],
    spritePath: getSpritePath()
};
function getSpritePath() {
    const serverPath = join(__dirname, '..', 'craft', 'ui', 'font.png');
    const localPath = join(__dirname, '..', 'public', 'ui', 'font.png');

    return fs.existsSync(serverPath) ? serverPath : localPath;
};
let digitSprite = null;

// Загружаем спрайт один раз при инициализации модуля
export const initGlyphService = async () => {
    try {
        digitSprite = await loadImage(GLYPH_CONFIG.spritePath);
        console.log('⬜ Спрайт цифр успешно загружен в сервис');
        return true;
    } catch (err) {
        console.error('❌ Ошибка загрузки спрайта в glyphGenerator:', err);
        return false;
    }
};

export const generateGlyphBuffer = (value) => {
    if (!digitSprite) return null;

    const digits = value.toString().split('');
    let img_width = 1;
    digits.forEach((digit) => {
        const num = parseInt(digit);
        if (isNaN(num)) return;
        img_width += GLYPH_CONFIG.nums[num] - 1;
    })


    const canvas = createCanvas(img_width, GLYPH_CONFIG.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let pos = 0;
    digits.forEach((digit, index) => {
        const num = parseInt(digit);
        if (isNaN(num)) return;
        let w = GLYPH_CONFIG.width

        ctx.drawImage(
            digitSprite,
            num * GLYPH_CONFIG.width, 0, GLYPH_CONFIG.width, GLYPH_CONFIG.height,
            pos, 0, GLYPH_CONFIG.width, GLYPH_CONFIG.height
        );
        pos += GLYPH_CONFIG.nums[num] - 1
    });

    return canvas.toBuffer('image/png');
};