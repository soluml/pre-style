export default function BabelPluginPreStyle({types: t}: any) {
  console.log('TYPES', {t});

  return {
    pre() {
      console.log('PRE');
    },
    post() {
      console.log('POST');
    },
    visitor: {
      TaggedTemplateExpression(fpath: any) {
        console.log('TT', {fpath});
      },
    },
  };
}
