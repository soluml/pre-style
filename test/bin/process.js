const processFiles = require('../../dist/bin/process').default;
const {cacheDirName} = require('../../dist/src').default;

const config = require('./prestyle.config.json');

describe('Bin Process', () => {
  const destination = cacheDirName('testfiles');
  const sourceDirectories = ['test/bin/html/*'];

  it('Can process', async () => {
    await processFiles(config, destination, sourceDirectories);

    expect(true).toBe(true);
  });
});
