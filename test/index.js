const expect = require('expect');
const PreStyle = require('../src/js/');

describe('Pre-Style', () => {
  it('Default character limits:', () => {
    expect(PreStyle`TESTING`).toBe('');
  });
});
