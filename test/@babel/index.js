const babel = require('@babel/core');

const options = {plugins: ['./dist/@babel']};

describe('@Babel', () => {
  it('Should process function strings', () => {
    const bt = babel.transformSync(
      `
      import PreStyle, {Other} from 'pre-style';

      const a = PreStyle\`color: blue\`;
    `,
      options
    );

    expect(bt.code).toBe(bt.code);
  });

  it('Should handle new namespaces function strings', () => {
    const bt = babel.transformSync(
      `
      import SomethingCustom from 'pre-style';

      const a = SomethingCustom\`color: green\`;
    `,
      options
    );

    expect(bt.code).toBe(bt.code);
  });
});
