const path = require('path');

const modules = [
  'assets',
  'components',
  'design',
  'hocs',
  'layouts',
  'lib',
  'pages',
  'services',
  'theme',
  'types',
  'utils'
];
function sourcePathResolve(directory) {
  return path.resolve(__dirname, 'src', directory);
}

function aliasBuilder(modules) {
  return modules.reduce((alias, name) => ({ ...alias, [name]: sourcePathResolve(name) }), {});
}

module.exports = {
  resolve: {
    alias: aliasBuilder(modules)
  }
};
