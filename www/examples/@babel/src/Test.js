import css from 'pre-style';

export default function Test() {
  const Cmpt = css.div`
    color: red;
    font-weight: bold;
  `;

  return <Cmpt>This is a test!!</Cmpt>;
}
