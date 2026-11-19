/* Portable, compressed OBS output URLs (v1).
 * Version 1 freezes the field order: append new fields, never reorder them.
 * Compression uses the built-in browser deflate codec, without external services.
 */
(function (global) {
  "use strict";

  const fields = Object.freeze([
    "edition", "editionSource", "title", "game", "round", "editionEn",
    "titleEn", "roundEn", "topName", "bottomName", "topNameEn", "bottomNameEn",
    "topPhoto", "bottomPhoto", "english", "boardPreset", "frameColor",
    "panelMode", "panelColor", "accentColor", "themeSubColor", "topColor",
    "bottomColor", "personal", "playerPhoto", "guide", "guideVerticalGap",
    "guideStart12", "guideStart6", "guideGoalStart", "guidePointGap",
    "video", "sponsors", "sponsors2", "rules", "right1Mode", "right2Mode",
    "right3Mode", "right4Mode", "right5Mode", "right1Thumbnail",
    "right2Thumbnail", "interval"
  ]);

  const supported = () => typeof CompressionStream === "function"
    && typeof DecompressionStream === "function";

  function toCompactArray(state, defaults) {
    const items = [1];
    fields.forEach((key, index) => {
      if (!Object.hasOwn(state, key)) return;
      if (JSON.stringify(state[key]) === JSON.stringify(defaults[key])) return;
      items.push(index, state[key]);
    });
    return items;
  }

  function fromCompactArray(items) {
    if (!Array.isArray(items) || items[0] !== 1 || items.length % 2 !== 1) {
      throw new Error("Invalid compact snapshot version or structure");
    }
    const restored = {};
    for (let i = 1; i < items.length; i += 2) {
      const index = items[i];
      if (!Number.isInteger(index) || index < 0 || index >= fields.length) {
        throw new Error("Unknown compact snapshot field");
      }
      restored[fields[index]] = items[i + 1];
    }
    return restored;
  }

  function toBase64Url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromBase64Url(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 20000) {
      throw new Error("Invalid compact snapshot encoding");
    }
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const data = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return Uint8Array.from(data, (char) => char.charCodeAt(0));
  }

  async function encode(state, defaults) {
    if (!supported()) throw new Error("Native deflate codec is unavailable");
    const bytes = new TextEncoder().encode(JSON.stringify(toCompactArray(state, defaults)));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
    return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
  }

  async function decode(value) {
    if (!supported()) throw new Error("Native inflate codec is unavailable");
    const bytes = fromBase64Url(value);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
    if (inflated.length > 1048576) throw new Error("Compact snapshot is too large");
    return fromCompactArray(JSON.parse(new TextDecoder().decode(inflated)));
  }

  global.JBSOutputSnapshot = Object.freeze({
    version: 1, supported, encode, decode
  });
})(window);
