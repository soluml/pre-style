#Pre-Style

```
npm install --save pre-style
```

[![npm version](https://badge.fury.io/js/pre-style.svg)](http://badge.fury.io/js/pre-style)
[![Build Status](https://travis-ci.org/soluml/pre-style.svg?branch=master)](https://travis-ci.org/soluml/pre-style)

### Using React or another JS-based templating framework?
Use the [Babel Plugin](https://github.com/soluml/babel-plugin-pre-style) instead of the root project to save yourself some hassle!

### Another [CSS-in-JS](https://github.com/MicheleBertoli/css-in-js) tool... why?
Unlike many of the other projects from which this project takes inspiration in many areas, Pre-Style places a priority on end-user performance while maintaining great usability for it's developers. Your end-user's don't care what your classes look like. They just want to use your app as soon as possible. Developers don't want to learn another proprietary syntax to author CSS. You won't have too.

## Usage
### Basic

The following syntax uses Pre-Style's [built in Sass adapter](./src/module/adapter.js#L3). You don't have to use Sass, though! You can use any language you like.

```jsx
//SASS. IN. YOUR. REACT!!!!
<button
  className={PreStyle`
    $btnBgc: #0071ba;

    background-color: $btnBgc;
    border: 1px solid currentColor;
    border-radius: 3px;
    color: white;
    font-size: 1em;
    margin: 1em;
    padding: $gutter/2 1em; //$gutter is defined in sass partial specified by the config

    &:hover {
      background-color: darken($btnBgc, 30%);
    }
  `}
>
  Click me!
</button>
```

During your build, Pre-Style will process `PreStyle` template strings and generate atomic classes for each CSS property used in your declaration. Don't worry about specifying properties twice. Don't worry about normalizing values. Pre-Style's got you and in true atomic fashion you just add the CSS you want applied for any given element.

The preceding code block will produce something like this in the generated CSS file:

```css
.A{background-color:#0071ba}
.B{border:1px solid currentColor}
.C{border-radius:3px}
.D{color:#fff}
.E{font-size:1em}
.F{margin:1em}
.G{padding:.625em 1em}
.H:hover{background-color:#001421}
```

And will be treated as this in your markup file (in this case our JSX):

```html
<button class="A B C D E F G H">Click me!</button>
```

Your initial Pre-Style code block will never exist in any output file. The end-user will only get the tiny atomic bits necessary for styling.

In essence, Pre-Style gives you the specificity handling of named conventions like [BEM](http://getbem.com/), the maintainability of [Inline CSS (Radium)](http://formidable.com/open-source/radium/), and the reusability and minuscule CSS/DOM footprint that only [Atomic](https://acss.io/) can provide.
