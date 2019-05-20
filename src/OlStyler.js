import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import Icon from 'ol/style/Icon';
import RegularShape from 'ol/style/RegularShape';
import Text from 'ol/style/Text';

import { getRules } from './Utils';
import getGeometryStyles from './GeometryStyles';

/**
 * @private
 * @param  {string} hex   eg #AA00FF
 * @param  {Number} alpha eg 0.5
 * @return {string}       rgba(0,0,0,0)
 */
function hexToRGB(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function polygonStyle(style) {
  const stroke = style.stroke && (style.stroke.css || style.stroke.svg);
  const fill = style.fill && (style.fill.css || style.fill.svg);
  return new Style({
    fill:
      fill &&
      new Fill({
        color:
          fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
            ? hexToRGB(fill.fill, fill.fillOpacity)
            : fill.fill,
      }),
    stroke:
      stroke &&
      new Stroke({
        color:
          stroke.strokeOpacity &&
          stroke.stroke &&
          stroke.stroke.slice(0, 1) === '#'
            ? hexToRGB(stroke.stroke, stroke.strokeOpacity)
            : stroke.stroke || '#3399CC',
        width: stroke.strokeWidth || 1.25,
        lineCap: stroke.strokeLinecap && stroke.strokeLinecap,
        lineDash: stroke.strokeDasharray && stroke.strokeDasharray.split(' '),
        lineDashOffset: stroke.strokeDashoffset && stroke.strokeDashoffset,
        lineJoin: stroke.strokeLinejoin && stroke.strokeLinejoin,
      }),
  });
}

/**
 * @private
 * @param  {LineSymbolizer} linesymbolizer [description]
 * @return {object} openlayers style
 */
function lineStyle(linesymbolizer) {
  let style = {};
  if (linesymbolizer.stroke) {
    style = linesymbolizer.stroke.css || linesymbolizer.stroke.svg;
  }
  return new Style({
    stroke: new Stroke({
      color:
        style.strokeOpacity && style.stroke && style.stroke.slice(0, 1) === '#'
          ? hexToRGB(style.stroke, style.strokeOpacity)
          : style.stroke || '#3399CC',
      width: style.strokeWidth || 1.25,
      lineCap: style.strokeLinecap && style.strokeLinecap,
      lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
      lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
      lineJoin: style.strokeLinejoin && style.strokeLinejoin,
    }),
  });
}

/**
 * @private
 * @param  {PointSymbolizer} pointsymbolizer [description]
 * @return {object} openlayers style
 */
function pointStyle(pointsymbolizer) {
  const { graphic: style } = pointsymbolizer;
  if (style.externalgraphic && style.externalgraphic.onlineresource) {
    return new Style({
      image: new Icon({ src: style.externalgraphic.onlineresource }),
    });
  }
  if (style.mark) {
    let { fill, stroke } = style.mark;
    const fillColor = (fill && fill.css && fill.css.fill) || 'blue';
    fill = new Fill({
      color: fillColor,
    });
    if (stroke && !(Number(stroke.css.strokeWidth) === 0)) {
      const { stroke: cssStroke, strokeWidth: cssStrokeWidth } = stroke.css;
      stroke = new Stroke({
        color: cssStroke || 'black',
        width: cssStrokeWidth || 2,
      });
    } else {
      stroke = undefined;
    }
    const radius = Number(style.size) || 10;
    switch (style.mark.wellknownname) {
      case 'circle':
        return new Style({
          image: new Circle({
            fill,
            radius,
            stroke,
          }),
        });
      case 'triangle':
        return new Style({
          image: new RegularShape({
            fill,
            points: 3,
            radius,
            stroke,
          }),
        });
      case 'star':
        return new Style({
          image: new RegularShape({
            fill,
            points: 5,
            radius1: radius,
            radius2: radius / 2.5,
            stroke,
          }),
        });
      case 'cross':
        return new Style({
          image: new RegularShape({
            fill,
            points: 4,
            radius1: radius,
            radius2: 0,
            stroke:
              stroke ||
              new Stroke({
                color: fillColor,
                width: radius / 2,
              }),
          }),
        });
      case 'x':
        return new Style({
          image: new RegularShape({
            angle: Math.PI / 4,
            fill,
            points: 4,
            radius1: radius,
            radius2: 0,
            stroke:
              stroke ||
              new Stroke({
                color: fillColor,
                width: radius / 2,
              }),
          }),
        });
      default:
        // Default is `square`
        return new Style({
          image: new RegularShape({
            angle: Math.PI / 4,
            fill,
            points: 4,
            radius,
            stroke,
          }),
        });
    }
  }
  return new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({
        color: 'blue',
      }),
    }),
  });
}

/**
 * @private
 * @param  {TextSymbolizer} textsymbolizer [description]
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @param {string} type geometry type, @see {@link http://geojson.org|geojson} for possible types
 * @return {object} openlayers style
 */
function textStyle(textsymbolizer, feature, type) {
  const properties = feature.getProperties
    ? feature.getProperties()
    : feature.properties;
  if (textsymbolizer && textsymbolizer.label) {
    const parseText = {
      text: part => part,
      propertyname: (part, props = {}) => props[part] || '',
    };
    const label = textsymbolizer.label.length
      ? textsymbolizer.label
      : [textsymbolizer.label];

    const text = label.reduce((string, part) => {
      const keys = Object.keys(part);
      return (
        string +
        (keys && parseText[keys[0]]
          ? parseText[keys[0]](part[keys[0]], properties)
          : '')
      );
    }, '');

    const fill = textsymbolizer.fill
      ? textsymbolizer.fill.css || textsymbolizer.fill.svg
      : {};
    const halo =
      textsymbolizer.halo && textsymbolizer.halo.fill
        ? textsymbolizer.halo.fill.css || textsymbolizer.halo.fill.svg
        : {};
    const haloRadius =
      textsymbolizer.halo && textsymbolizer.halo.radius
        ? parseFloat(textsymbolizer.halo.radius)
        : 1;
    const {
      fontFamily = 'sans-serif',
      fontSize = 10,
      fontStyle = '',
      fontWeight = '',
    } =
      textsymbolizer.font && textsymbolizer.font.css
        ? textsymbolizer.font.css
        : {};

    const pointplacement =
      textsymbolizer &&
      textsymbolizer.labelplacement &&
      textsymbolizer.labelplacement.pointplacement
        ? textsymbolizer.labelplacement.pointplacement
        : {};
    const displacement =
      pointplacement && pointplacement.displacement
        ? pointplacement.displacement
        : {};
    const offsetX = displacement.displacementx ? displacement.displacementx : 0;
    const offsetY = displacement.displacementy ? displacement.displacementy : 0;
    const lineplacement =
      textsymbolizer &&
      textsymbolizer.labelplacement &&
      textsymbolizer.labelplacement.lineplacement
        ? textsymbolizer.labelplacement.lineplacement
        : null;
    const rotation = pointplacement.rotation ? pointplacement.rotation : 0;

    const placement = type !== 'point' && lineplacement ? 'line' : 'point';

    // Halo styling

    return new Style({
      text: new Text({
        text,
        font: `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`,
        offsetX: Number(offsetX),
        offsetY: Number(offsetY),
        rotation,
        placement,
        textAlign: 'center',
        textBaseline: 'middle',
        stroke: textsymbolizer.halo
          ? new Stroke({
            color:
              halo.fillOpacity && halo.fill && halo.fill.slice(0, 1) === '#'
                ? hexToRGB(halo.fill, halo.fillOpacity)
                : halo.fill,
            // wrong position width radius equal to 2 or 4
            width:
              (haloRadius === 2 || haloRadius === 4
                ? haloRadius - 0.00001
                : haloRadius) * 2,
          })
          : undefined,
        fill: new Fill({
          color:
            fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
              ? hexToRGB(fill.fill, fill.fillOpacity)
              : fill.fill,
        }),
      }),
    });
  }
  return new Style({});
}

// Create memoized versions of the style converters.
// They use a WeakMap to return the same OL style object if the symbolizer is the same.
// Note: this only works for constant symbolizers!
// Todo: find a smart way to optimize text symbolizers.

/**
 * Function to memoize style conversion functions that convert sld symbolizers to OpenLayers style instances.
 * The memoized version of the style converter returns the same OL style instance if the symbolizer is the same object.
 * Uses a WeakMap internally.
 * Note: This only works for constant symbolizers.
 * Note: Text symbolizers depend on the feature property and the geometry type, these cannot be cached in this way.
 * @private
 * @param {Function} styleFunction Function that accepts a single symbolizer object and returns the corresponding OpenLayers style object.
 * @returns {Function} The memoized function of the style conversion function.
 */
function memoize(styleFunction) {
  const styleCache = new WeakMap();

  return symbolizer => {
    let olStyle = styleCache.get(symbolizer);

    if (!olStyle) {
      olStyle = styleFunction(symbolizer);
      styleCache.set(symbolizer, olStyle);
    }

    return olStyle;
  };
}

// Memoized versions of point, line and polygon style converters.
const cachedPointStyle = memoize(pointStyle);
const cachedLineStyle = memoize(lineStyle);
const cachedPolygonStyle = memoize(polygonStyle);

const defaultStyles = [
  new Style({
    image: new Circle({
      radius: 2,
      fill: new Fill({
        color: 'blue',
      }),
    }),
  }),
];

/**
 * Create openlayers style
 * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
 * @param {GeometryStyles} GeometryStyles rulesconverter
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
 * @return ol.style.Style or array of it
 */
export default function OlStyler(GeometryStyles, feature) {
  const geometry = feature.getGeometry
    ? feature.getGeometry()
    : feature.geometry;
  const type = geometry.getType ? geometry.getType() : geometry.type;
  const { polygon, line, point, text } = GeometryStyles;
  let styles = [];
  switch (type) {
    case 'Polygon':
    case 'MultiPolygon':
      for (let i = 0; i < polygon.length; i += 1) {
        styles.push(cachedPolygonStyle(polygon[i]));
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(textStyle(text[j], feature, 'polygon'));
      }
      break;
    case 'LineString':
    case 'MultiLineString':
      for (let j = 0; j < line.length; j += 1) {
        styles.push(cachedLineStyle(line[j]));
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(textStyle(text[j], feature, 'line'));
      }
      break;
    case 'Point':
    case 'MultiPoint':
      for (let j = 0; j < point.length; j += 1) {
        styles.push(cachedPointStyle(point[j]));
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(textStyle(text[j], feature, 'point'));
      }
      break;
    default:
      styles = defaultStyles;
  }
  return styles;
}

/**
 * @private
 * Extract feature id from an OpenLayers Feature.
 * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @returns {string} Feature id.
 */
function getOlFeatureId(feature) {
  return feature.getId();
}

/**
 * @private
 * Extract a property value from an OpenLayers Feature.
 * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @param {string} propertyName The name of the feature property to read.
 * @returns {object} Property value.
 */
function getOlFeatureProperty(feature, propertyName) {
  return feature.get(propertyName);
}

/**
 * Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.
 * @param {FeatureTypeStyle} featureTypeStyle Feature Type Style object.
 * @param {object} options Options
 * @param {function} options.convertResolution An optional function to convert the resolution in map units/pixel to resolution in meters/pixel.
 * When not given, the map resolution is used as-is.
 * @returns {Function} A function that can be set as style function on an OpenLayers vector style layer.
 * @example
 * myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle));
 */
export function createOlStyleFunction(featureTypeStyle, options = {}) {
  return (feature, mapResolution) => {
    // Determine resolution in meters/pixel.
    const resolution =
      typeof options.convertResolution === 'function'
        ? options.convertResolution(mapResolution)
        : mapResolution;

    // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
    const rules = getRules(featureTypeStyle, feature, resolution, {
      getProperty: getOlFeatureProperty,
      getFeatureId: getOlFeatureId,
    });

    // Convert style rules to style rule lookup categorized by geometry type.
    const geometryStyles = getGeometryStyles(rules);

    // Determine style rule array.
    const olStyles = OlStyler(geometryStyles, feature);

    return olStyles;
  };
}
