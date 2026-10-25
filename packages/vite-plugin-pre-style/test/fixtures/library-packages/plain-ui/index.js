import { css } from 'pre-style';

// Has blocks but no `pre-style` field, so it's only compiled when the app
// lists it in the plugin's `libraries` option.
export const plain = css`margin-top: 0;`;
