// Pre-Style component libraries ship their source, with the blocks still in
// it. The `pre-style` field in package.json tells each app's Pre-Style plugin
// to compile it, with the library's own tokens, so the library's classes
// share names and the CSS file with the app's own.
export { Button, buttonClass } from './Button';
export type { ButtonVariant } from './Button';
