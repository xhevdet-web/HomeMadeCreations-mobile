const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function api(fetch) {
  class NativeFormData {
    fields = new Map();
    append(key, value) { this.fields.set(key, value); }
    entries() { return this.fields.entries(); }
  }
  class PreviewFile {
    constructor(uri) { this.uri = uri; this.name = 'preview.png'; }
    exists = true;
    size = 4;
    type = 'image/png';
    async bytes() { return new Uint8Array([137, 80, 78, 71]); }
  }
  // Exercise the SDK's actual serializer, which rejected the previous URI object.
  const encoderModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('node_modules/expo/src/winter/fetch/convertFormData.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module: encoderModule, exports: encoderModule.exports, Blob, TextEncoder, Uint8Array,
    require: () => ({ blobToArrayBufferAsync: blob => blob.arrayBuffer() }),
  });
  const encode = encoderModule.exports.convertFormDataAsync;
  const module = { exports: {} };
  const deadlines = [];
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/commerceApi.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => name === 'expo-file-system' ? { File: PreviewFile }
      : name === 'expo/fetch' ? { fetch: async (url, options) => {
        if (options?.body instanceof NativeFormData) await encode(options.body);
        return fetch(url, options);
      } }
      : name === './authStorage'
      ? { authStorage: { read: async () => '{"accessToken":"test-token"}' } }
      : { parseTokens: value => value, parseUser: value => value },
    process: { env: { EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1' } },
    FormData: NativeFormData, AbortController, fetch,
    setTimeout: (_callback, ms) => { deadlines.push(ms); return 1; }, clearTimeout() {},
  });
  return { ...module.exports, deadlines };
}
const input = { categoryId: 'category', name: 'Bracelet', items: [{ subCategoryId: 'bead', quantity: 3, position: 0 }] };

test('iPhone captures upload as readable Files accepted by the actual Expo multipart encoder', async () => {
  let request;
  const client = api(async (_url, options) => {
    request = options;
    return { ok: true, status: 201, text: async () => '{"id":"saved-product"}' };
  });
  assert.equal((await client.commerceApi.save(input, '/private/var/mobile/preview.png')).id, 'saved-product');
  assert.equal(request.body.fields.get('designPreview').uri, 'file:///private/var/mobile/preview.png');
  assert.equal(request.body.fields.get('designPreview').type, 'image/png');
  assert.equal(request.body.fields.get('items'), JSON.stringify(input.items));
  assert.equal(request.headers['Content-Type'], undefined);
  assert.equal(request.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(client.deadlines, [45000]);
  await client.commerceApi.save(input, 'file:///data/cache/preview.png');
  assert.equal(request.body.fields.get('designPreview').uri, 'file:///data/cache/preview.png');
});

test('non-JSON backend errors retain HTTP status instead of reporting a connection failure', async () => {
  const client = api(async () => ({ ok: false, status: 502, text: async () => '<html>Bad gateway</html>' }));
  await assert.rejects(client.commerceApi.save(input, '/tmp/preview.png'), error =>
    error instanceof client.ApiError && error.status === 502 && error.message.includes('HTTP 502'));
});

test('backend image-storage error message is displayed unchanged', async () => {
  const client = api(async () => ({ ok: false, status: 503,
    text: async () => '{"message":"Image upload failed; please try again"}' }));
  await assert.rejects(client.commerceApi.save(input, '/tmp/preview.png'), error =>
    error.status === 503 && error.message === 'Image upload failed; please try again');
});
