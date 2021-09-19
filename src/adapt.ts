import fs from 'fs';
import util from 'util';
import type PreStyle from '.';

const readFile = util.promisify(fs.readFile);

function defaultAdapter(data: string, config?: Config) {
  const Sass = require('sass'); // eslint-disable-line
  const options: AdapterOptions = {data, outputStyle: 'compressed', ...config};

  return Sass.renderSync(options).css;
}

export default async function Adapt(
  this: PreStyle,
  classblock: string
): Promise<string> {
  let prependedFilesString = '';

  // Get all of the prependedFiles and string them together, if any
  if (this.config.prependedFiles) {
    const [getFile, writeFile] = await this.prependedFilesCache;

    prependedFilesString = (
      await Promise.all(
        this.config.prependedFiles.map(async (filePath: string) => {
          let file = getFile(filePath);

          if (!file) {
            file = await readFile(filePath, 'utf8');
            writeFile(filePath, file);
          }

          return file;
        })
      )
    ).join('');
  }

  // Pass the CSS string to the adapter
  const adapter = this.config.adapter || defaultAdapter;

  return adapter(
    `${prependedFilesString} .${this.placeholder} { ${classblock.toString()} }`
  );
}
