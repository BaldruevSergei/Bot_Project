// core/cryptobox.js
const KEY = "forbrain_secret_key_2026";

export function encrypt(str) {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(
      str.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)
    );
  }
  return btoa(out);
}

export function decrypt(b64) {
  const bin = atob(b64);
  let out = "";
  for (let i = 0; i < bin.length; i++) {
    out += String.fromCharCode(
      bin.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)
    );
  }
  return out;
}