import { css, cn } from 'pre.style';
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

document.body.className = cn(css`color: red; margin: 0;`, css`color: green;`);
document.body.dataset.dynamic = cn(base, big, window.location.hash);

export { base, big, button };
