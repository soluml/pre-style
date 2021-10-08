import type {BabelConfig, ClassifyResponse} from 'global';
import PreStyle from '../src';

const PS = new PreStyle(process.env.config as BabelConfig);
const response: ClassifyResponse[] = [];

try {
  (async (cssblocks: string[]) => {
    for (let i = 0, ln = cssblocks.length; i < ln; i++) {
      const cf = await PS.process(cssblocks[i]); // eslint-disable-line no-await-in-loop

      response.push(cf);
    }

    process.stdout.write(JSON.stringify(response));
  })(JSON.parse(process.env.cssblocks as string));
} catch (e) {
  process.stderr.write(`Pre-Style ran into an error:\r\n${e}`);
}
