import fs from 'fs';
import path from 'path';

const regularPath = 'C:\\\\Windows\\\\Fonts\\\\times.ttf';
const boldPath = 'C:\\\\Windows\\\\Fonts\\\\timesbd.ttf';

const regular = fs.readFileSync(regularPath).toString('base64');
const bold = fs.readFileSync(boldPath).toString('base64');

const content = `// Base64 encoded Times New Roman fonts for jsPDF (supports Vietnamese Unicode)
export const TIMES_REGULAR_BASE64 = "${regular}";
export const TIMES_BOLD_BASE64 = "${bold}";
`;

fs.writeFileSync(path.resolve('utils/pdfFonts.ts'), content, 'utf8');
console.log('pdfFonts.ts written! Sizes:', regular.length, bold.length);
