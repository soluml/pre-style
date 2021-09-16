import fs from 'fs';
import type PreStyle from './';

function defaultAdapter(data: string, config?: Config) {
    const Sass = require('sass');
    const options: AdapterOptions = { data, outputStyle: 'compressed', ...config };
    
    return Sass.renderSync(options).css;
}

export default function Adapt(this: PreStyle, classblock: string) {
  //Get all of the prependedFiles and string them together
  const preStr = ((this.config as Config).prependedFiles || []).map(fn => fs.readFileSync(fn).toString()).join('');

  //Pass the CSS string to the adapter
  const adapter = (this.config as Config).adapter || defaultAdapter;

  return adapter(`${preStr} .${this.placeholder} { ${classblock.toString()} }`);
}
