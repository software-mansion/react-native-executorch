import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startReporter } from './smoke-runner.mjs';

const passing = {
  status: 'pass',
  checks: ['tensor', 'worklet', 'model'],
  inference: { elements: 65536, backend: ['XnnpackBackend'] },
};

test('a valid app report passes, and stale tokens cannot pass the collector', async () => {
  const reporter = await startReporter('current-build', 0);
  try {
    const url = `http://127.0.0.1:${reporter.port}/result/`;
    assert.equal(
      (await fetch(url + 'previous-build', { method: 'POST', body: JSON.stringify(passing) }))
        .status,
      404
    );
    assert.equal(
      (await fetch(url + 'current-build', { method: 'POST', body: JSON.stringify(passing) }))
        .status,
      200
    );
    assert.deepEqual(await reporter.waitForReport(), passing);
  } finally {
    await reporter.close();
  }
});

for (const report of [
  { ...passing, status: 'fail', error: 'Native assertion failed' },
  { ...passing, checks: ['tensor'] },
  { ...passing, inference: { elements: 0, backend: [] } },
]) {
  test(`CI rejects a failed or incomplete report: ${JSON.stringify(report)}`, async () => {
    const reporter = await startReporter('build', 0);
    try {
      const rejected = assert.rejects(reporter.waitForReport());
      assert.equal(
        (
          await fetch(`http://127.0.0.1:${reporter.port}/result/build`, {
            method: 'POST',
            body: JSON.stringify(report),
          })
        ).status,
        400
      );
      await rejected;
    } finally {
      await reporter.close();
    }
  });
}

test('an app crash or missing callback fails with a timeout', async () => {
  const reporter = await startReporter('missing-app', 0, 25);
  try {
    await assert.rejects(reporter.waitForReport(), /timeout/);
  } finally {
    await reporter.close();
  }
});


test('simulator setup does not consume the app deadline, and waiting again does not reset it', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reporter = await startReporter('cold-boot', 0, 100);
  try {
    // A cold simulator may spend minutes migrating before the app can launch.
    t.mock.timers.tick(600000);
    const result = reporter.waitForReport();
    let settled = false;
    result.then(
      () => { settled = true; },
      () => { settled = true; }
    );
    t.mock.timers.tick(99);
    await Promise.resolve();
    assert.equal(settled, false, 'setup time must not expire the app deadline');
    assert.equal(reporter.waitForReport(), result);
    const rejected = assert.rejects(result, /timeout/);
    t.mock.timers.tick(1);
    await rejected;
  } finally {
    await reporter.close();
    t.mock.timers.reset();
  }
});
