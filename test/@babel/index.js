const babel = require('@babel/core');

const options = {plugins: ['./dist/@babel']};

describe('@Babel', () => {
  it('Should process function strings', () => {
    const bt = babel.transformSync(
      `
      import PreStyle from 'pre-style';

      const a = PreStyle\`color: blue\`;
    `,
      options
    );

    expect(bt.code).toBe(bt.code);
  });
});
