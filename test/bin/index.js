const path = require('path');
const {spawnSync} = require('child_process');

function cli(args, cwd) {
  return spawnSync(
    'node',
    [`${path.resolve(__dirname, '../../dist/bin/index')} ${args.join(' ')}`],
    {cwd}
  );
}

describe('Bin', () => {
  it('Gets the options', async () => {
    const result = cli(['-c', 'configfile.js'], '.');

    expect(result.code).toBe(1);
  });
});
