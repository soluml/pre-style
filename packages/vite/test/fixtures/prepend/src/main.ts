import { scss, type ClassValue } from '@pre.style/core';

const value: ClassValue = scss`color: $brand;`;
document.body.className = String(value);
