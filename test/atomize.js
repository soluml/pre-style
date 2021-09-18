const csstree = require("css-tree");
const placeholder = require("../dist/src").defaultPlaceholder;
const Atomize = require("../dist/src/atomize").default.bind({ placeholder });

describe("Atomizer", () => {
  it("Should atomize rules", () => {
    const css = `
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

  // it('Should handle classes correctly:', async () => {
  //   const css = `
  //     .extraClassFilter,
  //     .${placeholder} {
  //       column-count: 5;
  //       color: white;
  //     }

  //     .${placeholder} .test {
  //       --my-var: #fff;
  //       width: var(--my-var, min(50vw, calc(10px * 2)));
  //     }

  //     @media (max-width:600px) {
  //       .extraClassFilter,
  //       .asd > .${placeholder}:hover {
  //         height: 30px;
  //         font-size: .9em;
  //         color: rgba(255, 255, 255, .3)
  //       }

  //       @supports not ((text-align-last:justify)) {
  //         .${placeholder} {
  //           color: white;
  //           text-align: center;
  //         }
  //       }

  //       @supports not ((text-align-last:justify)) {
  //         .another {
  //           text-align: center
  //         }
  //       }
  //     }
  //   `;

  //   const atomizedCss = csstree.generate(Atomize(css));

  //   expect(atomizedCss).toBe(`.${placeholder}{color:white}.${placeholder}{column-count:5}.${placeholder} .test{width:var(--my-var, min(50vw, calc(10px * 2)))}.${placeholder} .test{--my-var: #fff}@media (max-width:600px){.asd>.${placeholder}:hover{color:rgba(255,255,255,.3)}.asd>.${placeholder}:hover{font-size:.9em}.asd>.${placeholder}:hover{height:30px}@supports not ((text-align-last:justify)){.${placeholder}{text-align:center}.${placeholder}{color:white}}}`);
  // });
});
