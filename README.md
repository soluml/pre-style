# Pre-Style

```
npm install --save pre-style
```

[![npm version](https://badge.fury.io/js/pre-style.svg)](http://badge.fury.io/js/pre-style)
[![Build Status](https://travis-ci.org/soluml/pre-style.svg?branch=master)](https://travis-ci.org/soluml/pre-style)

## Overview
Pre-Style is a tool that lets you author CSS-in-JS (or CSS-in-Markup) while outputting highly efficient CSS. In essence, Pre-Style gives you the specificity handling of named conventions like [BEM](http://getbem.com/), the maintainability of [Inline CSS (Radium)](http://formidable.com/open-source/radium/), and the reusability and minuscule CSS/DOM footprint that only [Atomic](https://acss.io/) can provide.

### Another [CSS-in-JS](https://github.com/MicheleBertoli/css-in-js) tool... why?
Unlike many of the other projects from which this project takes inspiration in many areas, Pre-Style places a priority on end-user performance while maintaining great usability for it's developers. Your end-user's don't care what your classes look like. They just want to use your app as soon as possible. Developers don't want to learn another proprietary syntax to author CSS. You won't need too.

### How does it work?
Pre-Style walks your source files in search of PreStyle (or other namespaces) code-blocks. For each code-block found, the CSS is processed, normalized, then written to a CSS file as atomic CSS classes for maximum reusability. Once it's done, it replaces your source files with the generated class names inserted in place of the original code-block and saves the new files in the output folder.

## Usage
### Basic

The following syntax uses Pre-Style's [built in Sass adapter](./src/module/adapter.js#L3). You don't have to use Sass, though! You can use any language you like.

```JSX
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
    padding: $gutter/2 1em; //$gutter is defined in a sass partial prepended with the prependedFiles option in the config

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

### CLI

```
Usage: prestyle [options] [path]

  Options:

  -h, --help                    output usage information
  -V, --version                 output the version number
  -c, --config [file]           source config file
  -o, --outputFile [file]       generated .css file
  -a, --adapter [file]          adapter function to process css
  -d, --destination <dir>       directory to put files processed by PreStyle
  -p, --prependedFiles <items>  comma separated list of files to prepend
  -n, --nameSpaces <items>      comma separated list of identifiers to use aside from `PreStyle`
```

#### Example:
```
prestyle -o _prestyle.scss -d src/css -p src/css/_vars.scss
```

### Adapting to JS variables

Often times we'll want to change styles in reaction to a JavaScript event. We can do so like so:

```JSX
function joinCSSClasses(...strs) {
  return strs
    .filter(str => str)
    .join(' ');
}

const MyBox = ({isVisible}) => (
  <div className={joinCSSClasses(
    PreStyle`
      background-color: blue;
      height: 100px;
      margin: 1em;
      padding: 1em;
      width: 100px;
    `,
    (!isVisible && PreStyle` display: none; `),
    (isPrimary ? PreStyle` font-weight: 700; ` : PreStyle` font-weight: 400; ` )
  )}>Talking 'bout, my box!</div>
);
```

### Plugins

   * Babel      : [babel-plugin-pre-style](https://github.com/soluml/babel-plugin-pre-style)
     * _Using React or another JS-based templating framework?_ Use this plugin instead of the root project to save yourself some hassle when working with JS templating projects!

## Configuration

#### --config [-c]
Path to a configuration file. The config file can contain all of the CLI options except for help, version, and config.

#### --outputFile [-o] (required)
The CSS file written by Pre-Style. This contains all of the atomic classes and is just vanilla CSS, but you can save this file as any type. Commonly the outputFile is set to `_atomic.scss` or `_prestyle.scss` for use with Sass based projects.

#### --adapter [-a]
A path to a exported JS module (or NPM module) used to process our code-blocks. The module must return an object with a css property where the css property is assigned to the processed CSS: i.e. `{ css: '.class1 { color: blue; }' }`. If this property isn't set, Pre-Style uses its internal node-sass adapter and you should use Sass syntax in your code-blocks.

#### --destination [-d] (required)
The destination directory. Your outputFile will be in here. Also, all of your processed source files will be spit out into this directory (when using the base project and not a plugin).

#### --prependedFiles [-p]
Files that will be prepended to each processed code-block. This is where you let Pre-Style know that you have variables, mixins, etc. that you want to use with your code-block syntax. Avoid sticking entire libraries here, as it'll be slow and muck up your output. Instead use varables, mixins, placeholders, etc. that won't impact the final output.

#### --nameSpaces [-n]
Want to use something other than `PreStyle` to denote your code-blocks? You can specify those namespaces here. A common namespace used is `styled` to take advantage of tooling available for [styled-components](https://github.com/styled-components/styled-components#syntax-highlighting).

## Examples

   * Static HTML & CSS
   We're using Pre-Style for our Github site at [pre.style](http://pre.style/). It's just HTML and CSS. You can see the source for that [here](/src/www).
