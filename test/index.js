const PreStyle = require("../dist/src").default;

const config = {};


describe('Pre-Style', () => {
  it('Default character limits:', async () => {
    const PS = new PreStyle(config);
    const data = await PS.process(`
      /* TEST */
      --my-var: #fff;

      font-weight: bold;
      color: $color;
      font-weight: bold;
      font-size: .9em;

      @extend .extraClassFilter; //From prependedFiles

      @media (max-width: 600px) {
        font-weight: normal;
      }

      &:hover,
      &:link,
      &:active {
        color: fuschia;
      }

      &:active {
        color: fuschia;
      }

      @supports not ((text-align-last:justify) or (-moz-text-align-last:justify)) {
        text-align: center;

        &:hover,
        &:link,
        &:active {
          color: green;
        }
      }

      @media (max-width: 600px) {
        height: 30px;
        font-size: 0.9em;
        color: rgba(255,255,255,.3)
      }

      @media (max-width: 600px), (min-width: 800px) {
        background-color: yellow;
        font-weight: normal;
      }

      .AnotherClass > & {
        color: white!important;
        font-weight: bolder;
      }

      &:hover {
        color: white;
        color: var(--my-var, white);
      }
    `);
    
    console.log(data);
    expect(Object.keys(data.classNames).map(key => data.classNames[key]).join(' ')).toBe('A B C D E F G H I J K L M N O P Q R S T U');
  });
});
