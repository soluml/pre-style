const expect = require('expect');
const PreStyle = require('../src/js/prestyle');

describe('Pre-Style', () => {
  it('Default character limits:', () => {
    expect(
      PreStyle`
        /* TEST */

        font-weight: bold;
        color: $color;
        font-weight: bold;
        font-size: .9em;

        @media (max-width: 600px) {
          font-weight: normal;
        }

        @supports not ((text-align-last:justify) or (-moz-text-align-last:justify)) {
          text-align: center;
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
        }
      `
    ).toBe(undefined);
  });
});
