const processFiles = require('../../dist/bin/process').default;
const defaultConfig = require('../../dist/bin/utils/defaultConfig').default;
const {cacheDirName} = require('../../dist/src').default;

const config = {
  ...defaultConfig,
  ...require('./prestyle.config.json'),
};

describe('Bin Process', () => {
  const destination = cacheDirName('testfiles');
  const sourceDirectories = ['test/bin/html/*'];

  it('Can process', async () => {
    const stuff = await processFiles(config, destination, sourceDirectories);

    expect(true).toBe(true);
  });
});
