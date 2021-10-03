import type {Config, AdapterOptions} from 'global';
import fs from 'fs';
import type PreStyle from '.';

function defaultAdapter(data: string, config?: Config) {
  const Sass = require('sass'); // eslint-disable-line
  const options: AdapterOptions = {
    data,
    outputStyle: 'compressed',
    ...config?.adapterOptions,
  };

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
            file = await fs.promises.readFile(filePath, 'utf8');
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
    `${prependedFilesString} .${this.placeholder} { ${classblock.toString()} }`,
    this.config.adapterOptions
  );
}
