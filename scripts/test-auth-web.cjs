const { spawnSync } = require('node:child_process');
const env = { ...process.env, EXPO_PUBLIC_API_URL: 'http://127.0.0.1:4173/api/v1' };
for (const args of [
  ['node_modules/expo/bin/cli', 'export', '--platform', 'web'],
  ['node_modules/@playwright/test/cli.js', 'test', 'tests/auth.spec.ts'],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
