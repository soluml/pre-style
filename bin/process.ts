import type {OutputConfig} from 'global';
import glob from 'fast-glob';

export default async function Process(
  config: OutputConfig,
  destination: string,
  sourceDirectories: string[]
) {
  const files = await glob(sourceDirectories);

  console.log('HELLO', {sourceDirectories, files});
}
