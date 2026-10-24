import { scss, type ClassValue } from 'pre-style';

const value: ClassValue = scss`color: $brand;`;
document.body.className = String(value);
