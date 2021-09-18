interface Constructor {
  [x:string]: any;
}

declare class SweatMap {
  constructor(config: Constructor);
}

declare module 'sweatmap' {
  export default SweatMap;
}

