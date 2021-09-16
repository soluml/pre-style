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
const fs_1 = __importDefault(require("fs"));
function defaultAdapter(data, config) {
    try {
        const Sass = require('sass');
        const options = Object.assign({ data, outputStyle: 'compressed' }, config);
        const css = Sass.renderSync(options).css;
        return Promise.resolve(css);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
function Adapt(classblock) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: 
        //Get all of the prependedFiles and string them together
        const preStr = (this.config.prependedFiles || []).map(fn => fs_1.default.readFileSync(fn).toString()).join('');
        //Pass the CSS string to the adapter
        const adapter = this.config.adapter || defaultAdapter;
        return '';
    });
}
exports.default = Adapt;
