const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const prestylePlugin = require('../../dist/postcss');
const PreStyle = require('../../dist/src').default;

const resultStr =
  '.B #id,.D{font-size:1em}.A,.C #id{color:#00f}@media (min-width:30em){.E,.G .other2{font-size:2em}.F,.H .other2{color:#00f}}#stuff .asd{color:green}';
const from = path.resolve(__dirname, 'test.css');

describe('postcss', () => {
  it('Should process css files', async () => {
    await PreStyle.clearCache();

    const css = await fs.promises.readFile(from, 'utf8');
    const result = await postcss([prestylePlugin]).process(css, {from});

    expect(result.css.trim()).toBe(resultStr);

    expect(require('./test.css.json')).toEqual(
      expect.objectContaining({
        article: 'A',
        title: 'B C',
        test: 'D A',
        other: 'E F G H',
      })
    );
  });

  it('Should process css files with the `onlyTheseFiles` option', async () => {
    await PreStyle.clearCache();

    const css = await fs.promises.readFile(from, 'utf8');
    const result = await postcss([
      prestylePlugin({
        onlyTheseFiles: /test.css$/,
      }),
    ]).process(css, {from});

    expect(result.css.trim()).toBe(resultStr);

    expect(require('./test.css.json')).toEqual(
      expect.objectContaining({
        article: 'A',
        title: 'B C',
        test: 'D A',
        other: 'E F G H',
      })
    );
  });
});
