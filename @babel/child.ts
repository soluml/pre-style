import type {BabelConfig} from 'global';
import PreStyle from '../src';

const PS = new PreStyle(process.env.config as BabelConfig);

(async (cssblocks: string[]) => {
  Promise.all(cssblocks.map((css) => PS.process(css))).then(
    (data) => process.stdout.write(JSON.stringify(data)),
    (e) => process.stderr.write(`Pre-Style ran into an error:\r\n${e}`)
  );
})(JSON.parse(process.env.cssblocks as string));
