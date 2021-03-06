import buble from 'rollup-plugin-buble';

const resolve = require('rollup-plugin-node-resolve');

export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: {
    file: 'dist/sldreader.js',
    format: 'umd',
    name: 'SLDReader',
    globals: {
      'ol/style/style': 'ol.style.Style',
      'ol/style/fill': 'ol.style.Fill',
      'ol/style/stroke': 'ol.style.Stroke',
      'ol/style/circle': 'ol.style.Circle',
      'ol/style/icon': 'ol.style.Icon',
      'ol/style/text': 'ol.style.Text',
      'ol/style/regularshape': 'ol.style.RegularShape',
    },
  },
  plugins: [buble(), resolve()],
};
