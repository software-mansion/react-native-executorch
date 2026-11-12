import path from 'node:path';

export function isInside(parent, child, paths = path) {
  const relative = paths.relative(parent, child);
  return (
    relative === '' ||
    (!paths.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${paths.sep}`))
  );
}

export function packageManagerCommand(
  command,
  args,
  platform = process.platform,
  execPath = process.execPath
) {
  if (!['npm', 'npx'].includes(command))
    throw new Error(`Unsupported package manager command: ${command}`);
  if (platform !== 'win32') return { command, args };
  // Windows npm/npx entry points are .cmd scripts. Invoke the npm installation
  // shipped beside node.exe directly, keeping paths and arguments out of a shell.
  const cli = path.win32.join(
    path.win32.dirname(execPath),
    'node_modules',
    'npm',
    'bin',
    `${command}-cli.js`
  );
  return { command: execPath, args: [cli, ...args] };
}
