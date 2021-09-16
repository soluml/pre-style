"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = require("os");
const ndjson_1 = __importDefault(require("ndjson"));
const THIRTY_DAYS = 2.592e+9;
const encoding = 'utf8';
const re = new RegExp(os_1.EOL, "g");
const replaceAllWhiteSpace = (str) => str.trim().replace(re, '');
function cache(filepath, cacheTime = THIRTY_DAYS, timestamp) {
    const stream = ndjson_1.default.stringify();
    const arr = [];
    let map;
    stream.on('data', (line) => {
        fs_1.default.appendFile(filepath, line + os_1.EOL, { encoding }, (err) => {
            if (err) {
                throw new Error('Could not write to cache');
            }
        });
    });
    function getter(block, skip) {
        var _a;
        return (_a = map.get(skip ? block : replaceAllWhiteSpace(block))) === null || _a === void 0 ? void 0 : _a[0];
    }
    function writer(block, classes) {
        const wsb = replaceAllWhiteSpace(block);
        if (!getter(wsb, true)) {
            const line = [wsb, [classes, timestamp]];
            stream.write(line);
        }
    }
    return new Promise((resolve) => {
        function done() {
            map = new Map(arr);
            resolve([getter, writer]);
        }
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.createReadStream(filepath, encoding)
                .pipe(ndjson_1.default.parse())
                .on('data', (d) => (d[1][1] > timestamp - cacheTime) && arr.push(d))
                .on('end', done);
        }
        else {
            done();
        }
    });
}
exports.default = cache;
