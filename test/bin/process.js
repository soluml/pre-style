const fs = require('fs');
const util = require('util');
const csstree = require('css-tree');
const processFiles = require('../../dist/bin/process').default;
const PreStyle = require('../../dist/src').default;
const config = require('./prestyle.config.json');

const readFile = util.promisify(fs.readFile);

describe('Bin Process', () => {
  const destination = PreStyle.cacheDirName('testfiles');
  const sourceDir = 'test/bin/html';
  const sourceDirectories = [`${sourceDir}/*`];

  it('Can process', async () => {
    await processFiles(config, destination, sourceDirectories);

    const files = await Promise.all([
      readFile(`${destination}/${sourceDir}/test.html`),
      readFile(`${destination}/${sourceDir}/test2.html`),
      readFile(`${destination}/prestyle.css`),
    ]);
    const cssfile = csstree.parse(files.pop());

    expect(files[0].includes('<body class="A B C D"></body>')).toBe(true);
    expect(files[1].includes('<body class="A B C D E F"></body>')).toBe(true);
    expect(cssfile.children.getSize()).toBe(6);
  });
});
