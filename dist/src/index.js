"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_cache_dir_1 = __importDefault(require("find-cache-dir"));
const cache_1 = __importDefault(require("./cache"));
class PreStyle {
    constructor(config) {
        this.placeholder = config.placeholder || '✨PLACEHOLDER✨';
        this.config = config;
        this.timestamp = Date.now();
        const cacheDir = (0, find_cache_dir_1.default)({ name: 'pre-style', create: true });
        this.styleCache = (0, cache_1.default)(cacheDir + '/style.ndjson', this.config.cache, this.timestamp);
    }
    process(block) {
        return __awaiter(this, void 0, void 0, function* () {
            if (~block.indexOf(this.placeholder)) {
                throw new Error(`The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use!`);
            }
            const [getter, writer] = yield this.styleCache;
            let classes = getter(block);
            if (!classes) {
                writer(block, 'aasdasdasd');
            }
            return classes;
        });
    }
}
// PreStyle.prototype.adapt = Adapt;
exports.default = PreStyle;
