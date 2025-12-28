// Vite сам прочитает файл и превратит его в строку
import pasContent from '../experimental/auto_inv.pas?raw'; 

const GUID_PLACEHOLDER = '{{CUSTOM_GUID}}';

// Просто экспортируем константу, которую ждет ваш билд
export const PASCAL_SCRIPT_TEMPLATE = pasContent;
