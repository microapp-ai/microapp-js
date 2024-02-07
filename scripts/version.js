const path = require("path");
const { execSync } = require("child_process");
const fsp = require("fs/promises");
const chalk = require("chalk");
const semver = require("semver");

const {
  ensureCleanWorkingDirectory,
  getPackageVersion,
  invariant,
  prompt,
  updateExamplesPackageConfig,
  updatePackageConfig,
} = require("./utils");
const { EXAMPLES_DIR } = require("./constants");

/**
 * @param {string} currentVersion
 * @param {string} givenVersion
 * @param {string} [prereleaseId]
 * @returns {string}
 */
function getNextVersion(currentVersion, givenVersion, prereleaseId) {
  invariant(
    givenVersion != null,
    `Missing next version. Usage: node version.js [nextVersion]`
  );

  if (/^pre/.test(givenVersion)) {
    invariant(
      prereleaseId != null,
      `Missing prerelease id. Usage: node version.js ${givenVersion} [prereleaseId]`
    );
  }

  let nextVersion;
  if (givenVersion === "experimental") {
    let hash = execSync(`git rev-parse --short HEAD`).toString().trim();
    nextVersion = `0.0.0-experimental-${hash}`;
  } else {
    // @ts-ignore
    nextVersion = semver.inc(currentVersion, givenVersion, prereleaseId);
  }

  invariant(nextVersion != null, `Invalid version specifier: ${givenVersion}`);

  return nextVersion;
}

async function run() {
  try {
    let args = process.argv.slice(2);
    let givenVersion = args[0];
    let prereleaseId = args[1];

    // 0. Make sure the working directory is clean
    ensureCleanWorkingDirectory();

    // 1. Get the next version number
    let version = semver.valid(givenVersion);
    let currentVersion = await getPackageVersion("microapp-react");
    if (version == null) {
      version = getNextVersion(currentVersion, givenVersion, prereleaseId);
    }

    // 2. Confirm the next version number
    let answer = await prompt(
      `Are you sure you want to bump version ${currentVersion} to ${version}? [Yn] `
    );

    if (answer === false) return 0;

    // 3. Update microapp-auth version
    await updatePackageConfig("microapp-auth", (config) => {
      config.version = version;
    });
    console.log(
      chalk.green(`  Updated @microapp-io/auth to version ${version}`)
    );

    // 4. Update microapp-react version + microapp-auth dep
    await updatePackageConfig("microapp-react", (config) => {
      config.version = version;
      config.dependencies["@microapp-io/auth"] = version;
    });
    console.log(
      chalk.green(`  Updated @microapp-io/react to version ${version}`)
    );

    // 5. Update microapp-auth and microapp-react versions in the examples
    let examples = await fsp.readdir(EXAMPLES_DIR);
    for (const example of examples) {
      let stat = await fsp.stat(path.join(EXAMPLES_DIR, example));
      if (!stat.isDirectory()) continue;

      await updateExamplesPackageConfig(example, (config) => {
        if (config.dependencies["@microapp-io/auth"]) {
          config.dependencies["@microapp-io/auth"] = version;
        }
        if (config.dependencies["@microapp-io/react"]) {
          config.dependencies["@microapp-io/react"] = version;
        }
      });
    }

    // 6. Commit and tag
    execSync(`git commit --all --message="Version ${version}"`);
    execSync(`git tag -a -m "Version ${version}" v${version}`);
    console.log(chalk.green(`  Committed and tagged version ${version}`));
  } catch (error) {
    console.log();
    console.error(chalk.red(`  ${error.message}`));
    console.log();
    return 1;
  }

  return 0;
}

run().then((code) => {
  process.exit(code);
});
