import { cpus } from 'node:os';
import { run } from 'node:test';
import { spec as Spec } from 'node:test/reporters';
// TODO: use native globbing after node22
import glob from 'fast-glob';

let exitCode = 0;
const spec = new Spec();

const files = await glob('src/**/*.spec.ts', {
  ignore: ['node_modules/**', 'dist/**'],
});

const testStreamSetup = run({
  files,
  timeout: 10_000,
  concurrency: cpus().length,
});

testStreamSetup.compose(spec).pipe(process.stdout);

const summary: string[] = [];

testStreamSetup.on('test:fail', (failed) => {
  exitCode = 1;
  const failedError = failed.details.error;

  summary.push(
    `${failed.file} - "${failed.name}" (${Math.round(
      failed.details.duration_ms,
    )}ms)\n${failedError.toString()} `,
  );
});

testStreamSetup.on('test:stderr', (data) => {
  summary.push(`${data.file} - Error:\n${data.message} `);
});

const start = Date.now();

testStreamSetup.once('end', () => {
  const duration = Date.now() - start;
  // print duration in blue
  // eslint-disable-next-line no-console
  console.log(
    '\u001B[34m%s\u001B[0m',
    `\nℹ Duration: ${duration / 1000}s\n`,
    '\u001B[0m',
  );
  if (summary.length > 0) {
    console.error('\u001B[31m%s\u001B', '\n✖ failing tests:\n');
    console.error(summary.join('\n'));
    console.error('\n------', '\u001B[0m\n');
  }
  process.exit(exitCode);
});
