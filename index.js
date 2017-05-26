module.exports = function PreStyle() {
  return arguments
    .filter(function (str) { return str; })
    .join(' ');
};
