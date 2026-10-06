/**
 * AppleDouble `._*` files left by macOS-packed artifacts.
 *
 * GNU tar extracts them as plain files, so a Linux install differed from a
 * macOS one and Expo's fingerprint with it (#1513). The postinstall removes
 * them after extracting.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const { removeAppleDoubleFiles } = require('../../scripts/download-libs.js');

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rnet-apple-double-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function touch(...segments: string[]) {
  const file = join(workDir, ...segments);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, '');
}

describe('removeAppleDoubleFiles', () => {
  it('removes AppleDouble files at every depth and keeps everything else', () => {
    // The paths GNU tar produces from headers.tar.gz and core-ios.tar.gz.
    touch('third-party', '._.');
    touch('third-party', '._include');
    touch('third-party', 'include', 'executorch', '._version.h');
    touch('third-party', 'include', 'executorch', 'version.h');
    touch('third-party', 'ios', '._ExecutorchLib.xcframework');
    touch('third-party', 'ios', 'ExecutorchLib.xcframework', 'Info.plist');
    touch('third-party', 'ios', 'libs', 'x._y.a');

    removeAppleDoubleFiles(join(workDir, 'third-party'));

    const exists = (...segments: string[]) => existsSync(join(workDir, 'third-party', ...segments));
    expect(exists('._.')).toBe(false);
    expect(exists('._include')).toBe(false);
    expect(exists('include', 'executorch', '._version.h')).toBe(false);
    expect(exists('ios', '._ExecutorchLib.xcframework')).toBe(false);
    expect(exists('include', 'executorch', 'version.h')).toBe(true);
    expect(exists('ios', 'ExecutorchLib.xcframework', 'Info.plist')).toBe(true);
    expect(exists('ios', 'libs', 'x._y.a')).toBe(true);
  });

  it('does not follow symlinks out of the tree', () => {
    touch('outside', '._kept');
    mkdirSync(join(workDir, 'third-party'));
    symlinkSync(join(workDir, 'outside'), join(workDir, 'third-party', 'link'), 'dir');

    removeAppleDoubleFiles(join(workDir, 'third-party'));

    expect(existsSync(join(workDir, 'outside', '._kept'))).toBe(true);
  });
});
