import type {BabelConfig} from 'global';

const PROP_NAME = 'p';

export default function (t: any, styled: BabelConfig['styled']) {
  if (typeof styled === 'boolean') {
    return function styledJSX(componentName: string, classes: string) {
      return t.arrowFunctionExpression(
        [t.identifier(PROP_NAME)],
        t.jsxElement(
          t.jsxOpeningElement(
            t.jsxIdentifier(componentName),
            [
              t.jsxSpreadAttribute(t.identifier(PROP_NAME)),
              t.jsxAttribute(
                t.jsxIdentifier('className'),
                t.jsxExpressionContainer(
                  t.binaryExpression(
                    '+',
                    t.StringLiteral(`${classes} `),
                    t.memberExpression(
                      t.identifier(PROP_NAME),
                      t.identifier('className')
                    )
                  )
                )
              ),
            ],
            true
          ),
          null,
          [],
          true
        ),
        false
      );
    };
  }

  return function styledObj(componentName: string, classes: string) {
    const ident =
      Array.isArray(styled) && styled.length === 1 ? styled[0] : styled;

    const callExpressionIdent =
      typeof ident === 'string'
        ? t.identifier(ident)
        : t.memberExpression(...ident!.map((id) => t.identifier(id)));

    return t.arrowFunctionExpression(
      [t.identifier(PROP_NAME)],
      t.callExpression(callExpressionIdent, [
        t.StringLiteral(componentName),
        t.callExpression(
          t.memberExpression(t.identifier('Object'), t.identifier('assign')),
          [
            t.objectExpression([]),
            t.identifier(PROP_NAME),
            t.objectExpression([
              t.objectProperty(
                t.identifier('className'),
                t.binaryExpression(
                  '+',
                  t.StringLiteral(`${classes} `),
                  t.memberExpression(
                    t.identifier(PROP_NAME),
                    t.identifier('className')
                  )
                )
              ),
            ]),
          ]
        ),
      ]),
      false
    );
  };
}
