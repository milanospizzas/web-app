import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { approvedStorefront, prepareCloudflare } from './prepare-cloudflare.mjs';

const webDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = resolve(webDirectory, '../..');

export function stagingEnvironment(inherited = process.env) {
  return {
    ...inherited,
    NODE_ENV: 'production',
    SITE_ENV: 'staging',
    NEXT_PUBLIC_SITE_URL: 'https://www.milanospizzas.com',
    ORDER_PROVIDER: 'skytab',
    ORDER_MODE: 'redirect',
    SKYTAB_ORDER_URL: approvedStorefront,
    SKYTAB_IFRAME_ENABLED: 'false',
    CUSTOM_ORDERING_ENABLED: 'false',
    CUSTOM_PAYMENT_ENABLED: 'false',
    CUSTOM_ORDER_URL: '',
    ACCOUNTS_ENABLED: 'false',
    ANALYTICS_ENABLED: 'false',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: '',
    SPECIALS_ENABLED: 'false',
    LOYALTY_ENABLED: 'false',
    MARKETING_SIGNUP_ENABLED: 'false',
    MARKETING_SIGNUP_DESTINATION: '',
    MARKETING_CONSENT_TEXT: '',
    MARKETING_UNSUBSCRIBE_CONFIGURED: 'false',
    PRIVACY_COPY_APPROVED: 'false',
    X_ENABLED: 'false',
    GOOGLE_REVIEW_URL: '',
  };
}

function runNode(args, env, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: repositoryDirectory,
    env,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Cloudflare build step failed (exit ${result.status ?? result.signal}).`);
  return result;
}

export function buildCloudflare() {
  const env = stagingEnvironment();
  // Resolve the lockfile-installed CLIs from their own packages. This works when
  // Wrangler invokes Node directly, even without Corepack or pnpm on PATH, and
  // avoids shell quoting and Windows .cmd spawning.
  const sharedRequire = createRequire(join(repositoryDirectory, 'packages/shared/package.json'));
  const webRequire = createRequire(join(webDirectory, 'package.json'));
  runNode(
    [
      sharedRequire.resolve('typescript/bin/tsc'),
      '--project',
      join(repositoryDirectory, 'packages/shared/tsconfig.json'),
    ],
    env
  );
  // Never deploy a preexisting out directory: a successful fresh Next export and
  // both validators must finish before Cloudflare metadata is emitted.
  runNode([webRequire.resolve('next/dist/bin/next'), 'build'], env, { cwd: webDirectory });
  runNode([join(webDirectory, 'scripts/validate-static.mjs')], env, { cwd: webDirectory });
  prepareCloudflare();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 2)
      throw new Error('Cloudflare staging builds do not accept environment/profile arguments.');
    buildCloudflare();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
