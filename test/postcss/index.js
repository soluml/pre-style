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

    expect(result.css).toBe(0);
  });
});
