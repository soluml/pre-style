import { css, merge } from 'pre-style';
import { button } from './button.ts';

const base = css`
  color: red;

  &:hover {
    color: blue;
  }
`;

const big = css`
  font-size: 2rem;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

document.body.className = merge(css`color: red; margin: 0;`, css`color: green;`);
document.body.dataset.dynamic = merge(base, big, window.location.hash);

export { base, big, button };
