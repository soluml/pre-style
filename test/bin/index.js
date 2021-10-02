const path = require('path');
const {spawnSync} = require('child_process');
const {cacheDirName} = require('../../dist/src').default;

function cli(args, sources = []) {
  return spawnSync('node', [
    path.resolve(__dirname, '../../dist/bin/index'),
    ...args,
    ...sources,
  ]);
}

describe('Bin', () => {
  const configPath = 'test/bin/prestyle.config.json';
  const cacheDir = cacheDirName('testfiles');
  const sources = ['test/bin/html/*'];

  it('Fails with no config file', async () => {
    const config = 'test/bin/bob.config.json';
    const result = cli(['-c', config]);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    expect(stderr).toBe('');
    expect(
      stdout.includes('Error: Cannot find module') && stdout.includes(config)
    ).toBe(true);
  });

  it('Fails with no destination', async () => {
    const result = cli(['-c', configPath]);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    expect(stderr).toBe('');
    expect(
      stdout.includes(
        'Error: You \x1B[1mMUST\x1B[22m specify a destination with \x1B[3m-d\x1B[23m or \x1B[3m--destination\x1B[23m.'
      )
    ).toBe(true);
  });

  it('Fails with no sources', async () => {
    const result = cli(['-c', configPath, '-d', cacheDir]);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    expect(stderr).toBe('');
    expect(
      stdout.includes('Error: No source files or folders were specified.')
    ).toBe(true);
  });

  it('Can write the files!', async () => {
    const result = cli(['-c', configPath, '-d', cacheDir], sources);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    expect(stderr).toBe('');
    expect(stdout.includes('Error: ')).toBe(false);
  });
});
