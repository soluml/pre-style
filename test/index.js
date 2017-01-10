const expect = require('expect');
const PreStyle = require('../src/js/');

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

        @media (max-width: 600px) {
          height: 30px;
          font-size: 0.9em;
        }

        @supports not ((text-align-last:justify) or (-moz-text-align-last:justify)) {
          text-align: center;
        }

        .AnotherClass > & {
          color: white!important;
          font-weight: bolder;
        }

        &:hover {
          color: white;
        }
      `
    ).toBe('body{color:#0071ba}');
  });
});
