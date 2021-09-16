import type PreStyle from './';
import fs from 'fs';

function defaultAdapter(data: string, config?: Config) {
    const Sass = require('sass');
    const options: AdapterOptions = { data, outputStyle: 'compressed', ...config };
    
    return Sass.renderSync(options).css;
}

export default async function Adapt(this: PreStyle, classblock: string) {
  const [getFile, writeFile] = await this.prependedFilesCache;

  //Get all of the prependedFiles and string them together
  const preStr = ((this.config as Config).prependedFiles || []).map((filePath: string) => {
    let file = getFile(filePath);

    if (!file) {
      file = fs.readFileSync(filePath).toString();
      writeFile(filePath, file);
    }

    return file;
  }).join('');

  //Pass the CSS string to the adapter
  const adapter = (this.config as Config).adapter || defaultAdapter;

  return adapter(`${preStr} .${this.placeholder} { ${classblock.toString()} }`);
}
