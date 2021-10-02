const path = require('path');
const {spawnSync} = require('child_process');
const {cacheDirName} = require('../../dist/src').default;

function cli(args) {
  return spawnSync('node', [
    path.resolve(__dirname, '../../dist/bin/index'),
    'sourcefiles',
    'sourcefiles2',
    'sourcefiles',
    ...args,
    // `-c`,
    // `test/bin/prestyle.config.json`,
    // `-d`,
    // `home/solum/projects/pre-style/node_modules/.cache/pre-style/files`,
  ]);
}

describe('Bin', () => {
  const configPath = 'test/bin/prestyle.config.json';

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
        'Error: You MUST specify a destination with -d or --destination.'
      )
    ).toBe(true);
  });

  it('Gets the options', async () => {
    const result = cli(['-c', configPath, '-d', cacheDirName('files')]);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    console.log({stdout, stderr});

    expect(stderr).toBe('');
    expect(stdout.includes('Error: ')).toBe(false);
  });
});
