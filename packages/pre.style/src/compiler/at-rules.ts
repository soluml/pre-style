// How each at-rule is processed, from css-at-rules.md at the repo root.
export interface AtRuleInfo {
  hoist: number | false;
  atomic: boolean;
  overridable: boolean;
}

// Keyed by Lightning CSS rule type. Rules Lightning CSS doesn't parse
// (`@when`, `@function`, `@mixin`, `@apply`, `@custom-selector`,
// `@color-profile`, `@nest`) arrive as `unknown` rules and are kept as-is.
export const AT_RULES: Record<string, AtRuleInfo> = {
  import: { hoist: 2, atomic: false, overridable: false },
  namespace: { hoist: 3, atomic: false, overridable: true },
  media: { hoist: false, atomic: true, overridable: false },
  supports: { hoist: false, atomic: true, overridable: false },
  container: { hoist: false, atomic: true, overridable: false },
  'custom-media': { hoist: false, atomic: false, overridable: true },
  'layer-statement': { hoist: 1, atomic: false, overridable: false },
  'layer-block': { hoist: false, atomic: true, overridable: false },
  scope: { hoist: false, atomic: true, overridable: false },
  'font-face': { hoist: false, atomic: false, overridable: true },
  'font-feature-values': { hoist: false, atomic: false, overridable: false },
  'font-palette-values': { hoist: false, atomic: false, overridable: true },
  keyframes: { hoist: false, atomic: false, overridable: true },
  'starting-style': { hoist: false, atomic: true, overridable: false },
  'view-transition': { hoist: false, atomic: false, overridable: true },
  property: { hoist: false, atomic: false, overridable: true },
  page: { hoist: false, atomic: false, overridable: false },
  'position-try': { hoist: false, atomic: false, overridable: true },
  'counter-style': { hoist: false, atomic: false, overridable: true },
  'moz-document': { hoist: false, atomic: true, overridable: false },
  viewport: { hoist: false, atomic: false, overridable: false },
};

const NOT_AT_RULE: AtRuleInfo = { hoist: false, atomic: false, overridable: false };

export function atRuleInfo(type: string): AtRuleInfo {
  return AT_RULES[type] ?? NOT_AT_RULE;
}

// At-rules that CSS nesting allows inside a style rule. Any other at-rule
// in a `css` block is moved out of the placeholder rule before parsing.
export const NESTABLE_AT_RULES = new Set([
  'media',
  'supports',
  'container',
  'layer',
  'scope',
  'starting-style',
  '-moz-document',
]);
