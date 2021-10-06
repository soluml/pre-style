const babel = require('@babel/core');

describe('@Babel', () => {
  it('Fails with no config file', async () => {
    const bt = babel.transform(`
      const asd = PreStyle\`hello\`;
    `);

    console.log(bt);

    expect(bt.code).toBe(true);
  });
});
