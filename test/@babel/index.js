const babel = require('@babel/core');

const plugins = ['./dist/@babel'];
const PreStyle = require('../../dist/src').default;

describe('@Babel', () => {
  it('Should process function strings with supplied namespace', async () => {
    await PreStyle.clearCache();

    const bt = babel.transformSync(
      `
import PreStyle, {Ignored} from 'pre-style';
const a = PreStyle\`font-size: 1em\`;
      `,
      {plugins}
    );
    expect(bt.code.trim()).toBe('const a = "A";');
  });

  it('Should handle new namespaces function strings', () => {
    const bt = babel.transformSync(
      `
import SomethingCustom from 'pre-style';
const a = SomethingCustom\`color: white;font-size: 1em;\`;
const b = SomethingCustom\`font-size: 1em;color: white;\`;
      `,
      {plugins: [plugins.concat({importAsCSS: true})]}
    );

    expect(bt.code.trim().startsWith('import')).toBe(true);

    expect(
      bt.code.trim().endsWith(`const a = "A B";
const b = "A B";`)
    ).toBe(true);

    expect(bt.code.includes('prestyle.css')).toBe(true);
  });

  it('Should handle not handle non namespaces function strings', () => {
    const code = `
import SomethingCustom from 'another-style';
const a = SomethingCustom\`color: blue\`;
`;

    const bt = babel.transformSync(code, {
      plugins: [plugins.concat({importAsCSS: true})],
    });

    expect(code.trim()).toBe(bt.code.trim());
  });

  it('Should handle styled namespace function strings', () => {
    const bt = babel.transformSync(
      `
import SomethingCustom from 'pre-style';
const a = SomethingCustom.div\`color: white;font-size: 1em;\`;
      `,
      {plugins: [plugins.concat({styled: true})]}
    );

    expect(
      bt.code
        .trim()
        .endsWith(
          `const a = p => <div {...p} className={"A B " + p.className} />;`
        )
    ).toBe(true);
  });
});
