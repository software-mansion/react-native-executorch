import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execute = promisify(execFile);

export async function startReporter(token, port = 18765, timeout = 180000) {
  let accept, reject;
  const result = new Promise((resolve, fail) => {
    accept = resolve;
    reject = fail;
  });
  // A failure may arrive while native installation/launch is still awaiting.
  result.catch(() => {});
  const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== `/result/${token}`) {
      response.writeHead(404).end();
      return;
    }
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16384) request.destroy(new Error('Smoke report exceeds 16 KB'));
    });
    request.on('error', reject);
    request.on('end', () => {
      try {
        const report = JSON.parse(body);
        assert.equal(report.status, 'pass', report.error ?? 'App reported failure');
        assert.deepEqual(report.checks, ['tensor', 'worklet', 'model']);
        assert.equal(report.inference?.elements, 256 * 256);
        assert.ok(report.inference?.backend?.includes('XnnpackBackend'));
        response.writeHead(200, { Connection: 'close' }).end('ok');
        accept(report);
      } catch (error) {
        response.writeHead(400, { Connection: 'close' }).end(String(error));
        reject(error);
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  let timer;
  return {
    port: server.address().port,
    // Booting and installing are setup; only app execution uses this deadline.
    waitForReport: () => {
      timer ??= setTimeout(
        () => reject(new Error('App did not report passing smoke assertions before the timeout')),
        timeout
      );
      return result;
    },
    close: async () => {
      clearTimeout(timer);
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

async function main() {
  const [platform, artifact, consumer, logs] = process.argv.slice(2);
  if (!['android', 'ios'].includes(platform) || !artifact || !consumer || !logs) {
    throw new Error(
      'Usage: node smoke-runner.mjs android|ios <APK-or-simulator-app> <consumer-directory> <log-directory>'
    );
  }
  mkdirSync(logs, { recursive: true });
  const config = JSON.parse(readFileSync(join(consumer, 'smoke-config.json'), 'utf8'));
  const reporter = await startReporter(config.token, config.port);
  const output = createWriteStream(join(logs, 'runtime.log'));
  let logger,
    udid,
    bootedByUs = false;
  try {
    if (platform === 'android') {
      await execute('adb', ['install', '-r', resolve(artifact)]);
      await execute('adb', ['reverse', `tcp:${config.port}`, `tcp:${config.port}`]);
      await execute('adb', ['logcat', '-c']);
      logger = spawn('adb', ['logcat', '-v', 'threadtime']);
      logger.stdout.pipe(output, { end: false });
      logger.stderr.pipe(output, { end: false });
      await execute('adb', ['shell', 'am', 'force-stop', config.bundleIdentifier]);
      reporter.waitForReport();
      await execute('adb', [
        'shell',
        'am',
        'start',
        '-W',
        '-n',
        `${config.bundleIdentifier}/.MainActivity`,
      ]);
    } else {
      const devices = JSON.parse(
        (await execute('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])).stdout
      );
      const device = Object.entries(devices.devices)
        .filter(([runtime]) => runtime.includes('.iOS-'))
        .flatMap(([, devices]) => devices)
        .find((device) => device.isAvailable && device.name.startsWith('iPhone'));
      if (!device) throw new Error('No available iPhone simulator');
      udid = device.udid;
      if (device.state !== 'Booted') {
        await execute('xcrun', ['simctl', 'boot', udid]);
        bootedByUs = true;
      }
      console.log(`Waiting up to 10 minutes for simulator ${device.name} (${udid})`);
      try {
        const boot = await execute('xcrun', ['simctl', 'bootstatus', udid, '-b'], {
          timeout: 600000,
          maxBuffer: 8 * 1024 * 1024,
        });
        writeFileSync(join(logs, 'simulator-boot.log'), boot.stdout + boot.stderr);
      } catch (error) {
        writeFileSync(
          join(logs, 'simulator-boot.log'),
          `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}\n`
        );
        throw error;
      }
      await execute('xcrun', ['simctl', 'install', udid, resolve(artifact)]);
      reporter.waitForReport();
      logger = spawn('xcrun', [
        'simctl',
        'launch',
        '--console',
        '--terminate-running-process',
        udid,
        config.bundleIdentifier,
      ]);
      logger.stdout.pipe(output, { end: false });
      logger.stderr.pipe(output, { end: false });
    }
    logger.on('error', (error) => output.write(`Log capture failed: ${error.message}\n`));
    const report = await reporter.waitForReport();
    writeFileSync(join(logs, 'smoke-result.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(
      'PASS: native tensor, worklet typed-array round trip and bundled XNNPACK inference'
    );
  } finally {
    logger?.stdout.unpipe(output);
    logger?.stderr.unpipe(output);
    logger?.kill();
    output.end();
    await reporter.close();
    if (platform === 'android') {
      await execute('adb', ['shell', 'am', 'force-stop', config.bundleIdentifier], {
        timeout: 15000,
      }).catch(() => {});
      await execute('adb', ['reverse', '--remove', `tcp:${config.port}`], {
        timeout: 15000,
      }).catch(() => {});
    } else if (udid) {
      await execute('xcrun', ['simctl', 'terminate', udid, config.bundleIdentifier], {
        timeout: 15000,
      }).catch(() => {});
      if (bootedByUs) {
        await execute('xcrun', ['simctl', 'shutdown', udid], { timeout: 15000 }).catch(
          () => {}
        );
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
