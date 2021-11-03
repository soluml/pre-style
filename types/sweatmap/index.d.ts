interface Constructor {
  [x: string]: any;
}

declare class SweatMap {
  constructor(config: Constructor);

  set(str: string): string;
}

declare module 'sweatmap' {
  export default SweatMap;
}
