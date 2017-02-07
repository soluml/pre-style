const PreStyle = require('../src/module/prestyle');

const { css, config, existing_strings } = process.env;
const pconfig = JSON.parse(config);
const es = JSON.parse(existing_strings);

PreStyle(css, pconfig, es).then(
  data => process.stdout.write(JSON.stringify(data)),
  e => process.stderr.write(`Pre-Style ran into an error:\r\n${e}`)
);
