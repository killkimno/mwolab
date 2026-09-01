/*
 * Reversible URL transport for MWO loadout codes.
 *
 * New share values use a `z` prefix followed by DEFLATE-compressed Base64URL.
 * Legacy MWO codes remain untouched and are handled by app.js.
 */
(function attachLoadoutUrlCodec(root) {
  "use strict";

  const PREFIX = "z";
  const MAX_LOADOUT_CODE_BYTES = 4096;
  const MAX_COMPRESSED_CHARACTERS = 8192;
  const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

  function requireCompressionApi() {
    if (
      typeof root.CompressionStream !== "function"
      || typeof root.DecompressionStream !== "function"
      || typeof root.TextEncoder !== "function"
      || typeof root.TextDecoder !== "function"
    ) {
      throw new Error("Compressed loadout URLs are not supported by this browser.");
    }
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return root.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    if (!value || value.length > MAX_COMPRESSED_CHARACTERS || !BASE64URL_PATTERN.test(value)) {
      throw new Error("Invalid compressed loadout URL.");
    }
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    let binary;
    try {
      binary = root.atob(value.replace(/-/g, "+").replace(/_/g, "/") + padding);
    } catch {
      throw new Error("Invalid compressed loadout URL.");
    }
    return root.Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function collectBytes(stream, maximumBytes) {
    const reader = stream.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maximumBytes) {
          await reader.cancel();
          throw new Error("Loadout URL data is too large.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = new root.Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk) => {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    });
    return result;
  }

  function transformedStream(bytes, transform) {
    return new root.Blob([bytes]).stream().pipeThrough(transform);
  }

  async function encode(code) {
    requireCompressionApi();
    const source = new root.TextEncoder().encode(String(code || "").trim());
    if (!source.length || source.length > MAX_LOADOUT_CODE_BYTES) {
      throw new Error("Loadout code is empty or too large.");
    }
    const compressed = await collectBytes(
      transformedStream(source, new root.CompressionStream("deflate")),
      MAX_LOADOUT_CODE_BYTES,
    );
    return `${PREFIX}${bytesToBase64Url(compressed)}`;
  }

  async function decode(value) {
    requireCompressionApi();
    const encoded = String(value || "").trim();
    if (!encoded.startsWith(PREFIX)) throw new Error("Invalid compressed loadout URL.");
    const compressed = base64UrlToBytes(encoded.slice(PREFIX.length));
    let restored;
    try {
      restored = await collectBytes(
        transformedStream(compressed, new root.DecompressionStream("deflate")),
        MAX_LOADOUT_CODE_BYTES,
      );
    } catch {
      throw new Error("Invalid compressed loadout URL.");
    }
    try {
      return new root.TextDecoder("utf-8", { fatal: true }).decode(restored);
    } catch {
      throw new Error("Invalid compressed loadout URL.");
    }
  }

  root.LoadoutUrlCodec = Object.freeze({ PREFIX, decode, encode });
}(typeof globalThis !== "undefined" ? globalThis : this));
