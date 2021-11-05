const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const prestylePlugin = require('../../dist/postcss');
const PreStyle = require('../../dist/src').default;

describe('postcss', () => {
  it('Should process css files', async () => {
    await PreStyle.clearCache();

    const from = path.resolve(__dirname, 'test.css');
    const css = await fs.promises.readFile(from, 'utf8');
    const result = await postcss([prestylePlugin]).process(css, {from});

    expect(result.css.trim()).toBe(
      '.B #id,.D{font-size:1em}.A,.C #id{color:#00f}@media (min-width:30em){.E,.G .other2{font-size:2em}.F,.H .other2{color:#00f}}#stuff .asd{color:green}'
    );

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
