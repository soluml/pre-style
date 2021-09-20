const csstree = require("css-tree");
const placeholder = require("../dist/src").defaultPlaceholder;
const Atomize = require("../dist/src/atomize").default.bind({ placeholder });

describe("Atomizer", () => {
  it("Should atomize rules", () => {
    const css = `
      /* Comment */

      .${placeholder} {
        column-count: 5;
        color: white;
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `.${placeholder}{color:white}.${placeholder}{column-count:5}`
    );
  });

  it("Should disregard extraneous rules", () => {
    const css = `
      .extraClassFilter,
      .${placeholder} .test {
        --my-var: #fff;
        width: var(--my-var, min(50vw, calc(10px * 2)));
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `.${placeholder} .test{width:var(--my-var, min(50vw, calc(10px * 2)))}.${placeholder} .test{--my-var: #fff}`
    );
  });

  it("Should disregard nested extraneous rules", () => {
    const css = `
      .extraClassFilter .hello,
      .${placeholder}::before {
        grid-area: 2 / 1 / 2 / 4;
        contain: size layout paint;
        font-size: clamp(1rem, 2.5vw, 2rem);
      }

      .${placeholder}::before {
        content: '';
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `.${placeholder}::before{font-size:clamp(1rem,2.5vw,2rem)}.${placeholder}::before{contain:size layout paint}.${placeholder}::before{grid-area:2 / 1 / 2 / 4}.${placeholder}::before{content:''}`
    );
  });

  it("Should handle nested placeholder rules", () => {
    const css = `
      .${placeholder},
      .another .${placeholder} .test {
        width: 100px;
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `.another .${placeholder} .test{width:100px}.${placeholder}{width:100px}`
    );
  });

  it("Should handle @rules", () => {
    const css = `
      @media (max-width:600px) {
        .asd > .${placeholder}:hover {
          height: 30px;
          font-size: .9em;
          color: rgba(255, 255, 255, .3)
        }
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `@media (max-width:600px){.asd>.${placeholder}:hover{color:rgba(255,255,255,.3)}}@media (max-width:600px){.asd>.${placeholder}:hover{font-size:.9em}}@media (max-width:600px){.asd>.${placeholder}:hover{height:30px}}`
    );
  });

  it("Should handle nested @rules", () => {
    const css = `
      @media (max-width:600px) {
        .${placeholder} {
          fill: currentColor;
          height: fit-content;
        }

        @supports not ((text-align-last:justify)) {
          .${placeholder} {
            color: white;
            text-align: center;
          }
        }
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `@media (max-width:600px){.${placeholder}{height:fit-content}}@media (max-width:600px){.${placeholder}{fill:currentColor}}@media (max-width:600px){@supports not ((text-align-last:justify)){.${placeholder}{text-align:center}}}@media (max-width:600px){@supports not ((text-align-last:justify)){.${placeholder}{color:white}}}`
    );
  });

  it("Should handle deeply nested @rules", () => {
    const css = `
      @media (max-width:600px) {
        .${placeholder} {
          color: white;
          aspect-ratio: 1;
        }

        @media (max-width: 600px), (min-width: 200px) {
          .${placeholder}, .test {
            background-color: yellow;
            font-weight: normal;
          }

          @supports not ((text-align-last:justify) or (-moz-text-align-last:justify)) {
            .${placeholder}:hover,
            .${placeholder}:link,
            .${placeholder}:active {
              color: green;
            }

            @container (min-width: 650px){
              .card {
                display: grid;
                grid-template-columns: 2fr 1fr;
              }
            }

            @container (min-width: 650px){
              .${placeholder} {
                container-type: inline-size;
                display: grid;
                grid-template-columns: 2fr 1fr;
              }
            }
          }
        }
      }
    `;

    expect(csstree.generate(Atomize(css))).toBe(
      `@media (max-width:600px){.${placeholder}{aspect-ratio:1}}@media (max-width:600px){.${placeholder}{color:white}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){.${placeholder}{font-weight:normal}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){.${placeholder}{background-color:yellow}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){.${placeholder}:active{color:green}}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){.${placeholder}:link{color:green}}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){.${placeholder}:hover{color:green}}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){@container (min-width: 650px){.${placeholder}{grid-template-columns:2fr 1fr}}}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){@container (min-width: 650px){.${placeholder}{display:grid}}}}}@media (max-width:600px){@media (max-width:600px),(min-width:200px){@supports not ((text-align-last:justify) or (-moz-text-align-last:justify)){@container (min-width: 650px){.${placeholder}{container-type:inline-size}}}}}`
    );
  });
});
