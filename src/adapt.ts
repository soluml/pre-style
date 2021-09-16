import type PreStyle from './';
import fs from 'fs';

function defaultAdapter(data: string, config?: Config) {
    const Sass = require('sass');
    const options: AdapterOptions = { data, outputStyle: 'compressed', ...config };
    
    return Sass.renderSync(options).css;
}

export default async function Adapt(this: PreStyle, classblock: string) {
  let prependedFilesString = '';

  //Get all of the prependedFiles and string them together, if any
  if (this.config.prependedFiles) {
    const [getFile, writeFile] = await this.prependedFilesCache;

    prependedFilesString = this.config.prependedFiles.map((filePath: string) => {
      let file = getFile(filePath);

      if (!file) {
        file = fs.readFileSync(filePath).toString();
        writeFile(filePath, file);
      }

      return file;
    }).join('');
  }

  //Pass the CSS string to the adapter
  const adapter = this.config.adapter || defaultAdapter;

  return adapter(`${prependedFilesString} .${this.placeholder} { ${classblock.toString()} }`);
}
