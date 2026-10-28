import { cn, css } from '@pre.style/core';
import {
  button,
  card,
  title,
  'primary-button' as primary,
} from './button.css' with { type: 'pre.style' };
import * as theme from './theme.scss' with { type: 'pre.style' };

const composed = css`
  composes: surface from './theme.scss';
  padding-top: 0;
`;

document.body.className = cn(button, theme.surface);
document.body.dataset.primary = cn(primary, window.location.hash);
document.body.dataset.card = card;
document.body.dataset.title = title;
document.body.dataset.composed = composed;
