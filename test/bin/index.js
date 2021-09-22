const path = require('path');
const {spawnSync} = require('child_process');

function cli(args) {
  return spawnSync('node', [
    path.resolve(__dirname, '../../dist/bin/index'),
    args.join(' '),
  ]);
}

describe('Bin', () => {
  it('Gets the options', async () => {
    const result = cli(['-c', 'configfile.js']);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();

    console.log({stdout, stderr});

    expect(result.code).toBe(1);
  });
});
