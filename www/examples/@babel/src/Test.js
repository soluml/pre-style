import css from 'pre-style';

export default function Test() {
  return (
    <div
      className={css`
        color: red;
        font-weight: bold;
      `}
    >
      This is a test!!
    </div>
  );
}
