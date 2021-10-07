const babel = require('@babel/core');

const plugins = ['./dist/@babel'];

describe('@Babel', () => {
  it('Should process function strings', () => {
    const bt = babel.transformSync(
      `
      import PreStyle, {Ignored} from 'pre-style';

      const a = PreStyle\`color: blue\`;
    `,
      {plugins}
    );
    expect(bt.code).toBe(bt.code);
  });

  it('Should handle new namespaces function strings', () => {
    const bt = babel.transformSync(
      `
      import SomethingCustom from 'pre-style';

      const a = SomethingCustom\`color: green\`;
    `,
      {plugins: [plugins.concat({importAsCSS: true})]}
    );

    expect(bt.code).toBe(bt.code);
  });
});
