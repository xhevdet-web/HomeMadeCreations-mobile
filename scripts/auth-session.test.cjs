const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      require: (name) => (name in mocks ? mocks[name] : require(name)),
      process,
      Date,
      Promise,
      Error,
      JSON,
      Number,
      setTimeout,
      clearTimeout,
    },
    { filename: file },
  );
  return module.exports;
}
const { parseTokens } = load('src/services/authApi.ts');
const user = { id: '1', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com' };
const tokens = () => ({
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  expiresAt: Date.now() + 60000,
});
function fixture(initial = null) {
  let saved = initial;
  let writes = 0;
  const api = { login: async () => tokens(), me: async () => user, register: async () => {} };
  const storage = {
    read: async () => saved,
    write: async (value) => {
      saved = value;
      writes++;
    },
    clear: async () => {
      saved = null;
    },
  };
  const create = () =>
    load('src/store/authStore.ts', {
      '../services/authApi': { authApi: api, parseTokens },
      '../services/authStorage': { authStorage: storage },
    }).useAuthStore;
  return { create, api, storage, saved: () => saved, writes: () => writes };
}
test('fresh install starts checking then anonymous', async () => {
  const f = fixture(),
    store = f.create();
  assert.equal(store.getState().status, 'checking');
  await store.getState().restore();
  assert.equal(store.getState().status, 'anonymous');
});
test('login validates with server before storing only tokens', async () => {
  const f = fixture(),
    store = f.create();
  await store.getState().signIn('mila@example.com', 'secret');
  assert.equal(store.getState().status, 'authenticated');
  assert.equal(JSON.parse(f.saved()).accessToken, 'test-access');
  assert.equal(f.saved().includes('secret'), false);
  assert.equal(f.saved().includes('mila'), false);
});
test('app restart restores native secure session after server validation', async () => {
  const f = fixture();
  await f.create().getState().signIn('mila@example.com', 'secret');
  const restarted = f.create();
  await restarted.getState().restore();
  assert.equal(restarted.getState().status, 'authenticated');
  assert.equal(restarted.getState().user.id, '1');
});
test('expired tokens fail closed and are cleared; no unsupported refresh request', async () => {
  const f = fixture(JSON.stringify({ ...tokens(), expiresAt: Date.now() - 1 })),
    store = f.create();
  let calls = 0;
  f.api.me = async () => {
    calls++;
    return user;
  };
  await store.getState().restore();
  assert.equal(store.getState().status, 'anonymous');
  assert.equal(f.saved(), null);
  assert.equal(calls, 0);
});
test('corrupt storage and revoked sessions cannot unlock routes', async () => {
  for (const saved of ['bad-json', JSON.stringify(tokens())]) {
    const f = fixture(saved),
      store = f.create();
    f.api.me = async () => {
      throw new Error('revoked');
    };
    await store.getState().restore();
    assert.equal(store.getState().status, 'anonymous');
    assert.equal(f.saved(), null);
  }
});
test('failed login never writes a session', async () => {
  const f = fixture(),
    store = f.create();
  await store.getState().restore();
  f.api.login = async () => {
    throw new Error('unauthorized');
  };
  await assert.rejects(store.getState().signIn('mila@example.com', 'wrong'));
  assert.equal(store.getState().status, 'anonymous');
  assert.equal(f.writes(), 0);
});
test('logout clears tokens and a subsequent restart remains anonymous', async () => {
  const f = fixture(),
    store = f.create();
  await store.getState().signIn('mila@example.com', 'secret');
  await store.getState().logout();
  assert.equal(f.saved(), null);
  const restarted = f.create();
  await restarted.getState().restore();
  assert.equal(restarted.getState().status, 'anonymous');
});
test('late login cannot resurrect a logged-out session', async () => {
  const f = fixture(),
    store = f.create();
  let resolve;
  f.api.me = () =>
    new Promise((done) => {
      resolve = done;
    });
  const pending = store.getState().signIn('mila@example.com', 'secret');
  await Promise.resolve();
  await Promise.resolve();
  await store.getState().logout();
  resolve(user);
  await pending;
  assert.equal(store.getState().status, 'anonymous');
  assert.equal(f.saved(), null);
});
test('SecureStore failure cannot authenticate the app', async () => {
  const f = fixture(),
    store = f.create();
  await store.getState().restore();
  f.storage.write = async () => {
    throw new Error('storage unavailable');
  };
  await assert.rejects(store.getState().signIn('mila@example.com', 'secret'));
  assert.equal(store.getState().status, 'anonymous');
});
test('native adapter uses Expo SecureStore for read/write/delete', async () => {
  const calls = [];
  const { authStorage } = load('src/services/authStorage.ts', {
    'expo-secure-store': {
      getItemAsync: async (key) => {
        calls.push(['read', key]);
        return null;
      },
      setItemAsync: async (key, value) => {
        calls.push(['write', key, value]);
      },
      deleteItemAsync: async (key) => {
        calls.push(['clear', key]);
      },
    },
  });
  await authStorage.read();
  await authStorage.write('tokens');
  await authStorage.clear();
  assert.equal(calls.map((call) => call[0]).join(','), 'read,write,clear');
  assert.ok(calls.every((call) => call[1] === 'homemade.auth.tokens.v1'));
});
