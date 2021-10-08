const babel = require('@babel/core');

const plugins = ['./dist/@babel'];

describe('@Babel', () => {
  it('Should process function strings with supplied namespace', () => {
    const bt = babel.transformSync(
      `
import PreStyle, {Ignored} from 'pre-style';
const a = PreStyle\`color: red\`;
      `,
      {plugins}
    );
    expect(bt.code.trim()).toBe('const a = "A";');
  });

  it('Should handle new namespaces function strings', () => {
    const bt = babel.transformSync(
      `
import SomethingCustom from 'pre-style';
const a = SomethingCustom\`color: white\`;
      `,
      {plugins: [plugins.concat({importAsCSS: true})]}
    );

    expect(bt.code.trim().startsWith('import')).toBe(true);
    expect(bt.code.trim().endsWith('const a = "A";')).toBe(true);
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
});
