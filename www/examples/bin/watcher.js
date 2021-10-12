const chokidar = require('chokidar');
const {execSync} = require('child_process');

const watcher = chokidar.watch(['partials', 'pages', 'layouts'], {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});
let timeout;

function debouncedBuild() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    execSync('npm run build');
    console.log(`Updated at ${Date.now()}!`);
  }, 10);
}

watcher
  .on('add', debouncedBuild)
  .on('change', debouncedBuild)
  .on('unlink', debouncedBuild);
