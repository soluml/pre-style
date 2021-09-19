import CSSO from 'csso';

export default function Normalize(processedCss: string) {
  const result = CSSO.minify(processedCss, {restructure: true});

  return result.css;
}
