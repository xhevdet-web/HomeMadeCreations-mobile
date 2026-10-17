const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: (name) => name in mocks ? mocks[name] : require(name),
    process: { env: { EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1' } },
    FormData, AbortController, URL, setTimeout, clearTimeout,
    ...globals,
  }, { filename: file });
  return module.exports;
}

function baseClient(fetch) {
  let config;
  load('src/api/apiSlice.ts', {
    '@reduxjs/toolkit/query/react': { createApi: (value) => { config = value; return {}; } },
    'expo/fetch': { fetch },
    '@/services/authStorage': { authStorage: { read: async () => '{"accessToken":"test","expiresAt":9999999999999}' } },
    '@/api/authModels': { parseTokens: value => value },
  });
  return (args) => config.baseQuery(args, { signal: new AbortController().signal });
}

test('multipart upload sends a bearer token and lets the runtime set the boundary', async () => {
  let sent;
  const send = baseClient(async (_url, options) => {
    sent = options;
    return { ok: true, status: 201, text: async () => '{"id":"product"}' };
  });
  const body = new FormData();
  body.append('items', '[]');
  const result = await send({ url: '/products', method: 'POST', body, auth: true });
  assert.equal(result.data.id, 'product');
  assert.equal(sent.body, body);
  assert.equal(sent.headers.Authorization, 'Bearer test');
  assert.equal(sent.headers['Content-Type'], undefined);
});

test('non-JSON server errors retain HTTP status', async () => {
  const send = baseClient(async () => ({ ok: false, status: 502, text: async () => '<html>Bad gateway</html>' }));
  const result = await send({ url: '/products', auth: true });
  assert.equal(result.error.status, 502);
  assert.match(result.error.message, /HTTP 502/);
});

test('server upload error message reaches the caller', async () => {
  const send = baseClient(async () => ({ ok: false, status: 503,
    text: async () => '{"message":"Image upload failed; please try again"}' }));
  const result = await send({ url: '/products', method: 'POST', auth: true });
  assert.equal(result.error.status, 503);
  assert.equal(result.error.message, 'Image upload failed; please try again');
});

test('preview form data uses Expo File for native uploads', async () => {
  class NativeFormData {
    fields = new Map();
    append(key, value) { this.fields.set(key, value); }
    get(key) { return this.fields.get(key); }
  }
  class PreviewFile {
    constructor(uri) { this.uri = uri; this.name = 'preview.png'; }
    exists = true;
    size = 4;
    type = 'image/png';
  }
  const { productFormData } = load('src/api/endpoints/productSlice.ts', {
    'expo-file-system': { File: PreviewFile },
    'expo/fetch': { fetch },
    '../apiSlice': { apiSlice: { injectEndpoints: () => ({}) }, ApiError: Error },
    '../constants': {},
    '@/api/catalogModels': {},
    '@/store/catalogStore': {},
  }, { FormData: NativeFormData });
  const input = { categoryId: 'category', name: 'Bracelet',
    items: [{ subCategoryId: 'bead', quantity: 3, position: 0 }] };
  const body = await productFormData(input, '/private/var/mobile/preview.png');
  assert.equal(body.get('designPreview').uri, 'file:///private/var/mobile/preview.png');
  assert.equal(body.get('items'), JSON.stringify(input.items));
});
