const path = require('path');
const { execSync } = require('child_process');

const jsonfile = require('jsonfile');
const semver = require('semver');

const rootDir = path.resolve(__dirname, '..');

/**
 * @param {*} cond
 * @param {string} message
 * @returns {asserts cond}
 */
function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

/**
 * @returns {string}
 */
function getTaggedVersion() {
  let output = execSync('git tag --list --points-at HEAD').toString();
  return output.replace(/^v|\n+$/g, '');
}

/**
 * @param {string} packageName
 * @param {string|number} version
 */
async function ensureBuildVersion(packageName, version) {
  let file = path.join(rootDir, 'packages', packageName, 'package.json');
  let json = await jsonfile.readFile(file);
  invariant(
    json.version === version,
    `Package ${packageName} is on version ${json.version}, but should be on ${version}`
  );
}

/**
 * @param {string} packageName
 * @param {string} tag
 */
function publishBuild(packageName, tag) {
  let buildDir = path.join(rootDir, 'packages', packageName);
  console.log();
  console.log(`  npm publish ${buildDir} --tag ${tag} --access public`);
  console.log();
  execSync(`npm publish ${buildDir} --tag ${tag} --access public`, {
    stdio: 'inherit',
  });
}

/**
 * @returns {Promise<1 | 0>}
 */
async function run() {
  try {
    // 0. Get the current tag, which has the release version number
    let version = getTaggedVersion();
    invariant(
      version !== '',
      'Missing release version. Run the version script first.'
    );

    // 1. Determine the appropriate npm tag to use
    let tag = version.includes('experimental')
      ? 'experimental'
      : semver.prerelease(version) == null
      ? 'latest'
      : 'pre';

    console.log();
    console.log(`  Publishing version ${version} to npm with tag "${tag}"`);

    // 2. Ensure build versions match the release version
    await ensureBuildVersion('auth', version);
    await ensureBuildVersion('build', version);
    await ensureBuildVersion('react', version);

    // 3. Publish to npm
    publishBuild('auth', tag);
    publishBuild('build', tag);
    publishBuild('react', tag);
  } catch (error) {
    console.log();
    console.error(`  ${error.message}`);
    console.log();
    return 1;
  }

  return 0;
}

run().then((code) => {
  process.exit(code);
});
