import { css } from 'pre.style';
import { button, icon } from 'acme-ui';
import { plain } from 'plain-ui';

const app = css`color: red;`;
document.body.dataset.app = app;
document.body.dataset.button = button;
document.body.dataset.icon = icon;
document.body.dataset.plain = plain;
