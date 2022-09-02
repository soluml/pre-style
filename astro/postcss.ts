import getJSON from '../postcss/saveJSONToPreStyleCache';

export const DEFAULT_MATCHER = '.prestyle.(c|le|sa|sc)ss';

export const getRegex = (matcher: string) => new RegExp(`${matcher}?$`);

export const getRegexWithOptionalQueryString = (matcher: string) =>
  new RegExp(`${matcher}(?.*)?$`);

export default function PreStyleAstroPostCSSConfig(
  preStyleFileMatcher = DEFAULT_MATCHER
) {
  return {
    'pre-style/postcss': {
      onlyTheseFiles: getRegexWithOptionalQueryString(preStyleFileMatcher),
      getJSON,
    },
  };
}
