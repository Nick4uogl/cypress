import fs from "fs/promises";
import { globby } from "globby";
import { minimatch } from "minimatch";

// These are the same properties that are set in cypress.config.
// In practice, it's better to export these from another file, and
// import them here and in cypress.config, so that both files use
// the same values.
const specPatterns = {
  specPattern: "cypress/e2e/**/*.cy.{ts,tsx,js,jsx}",
};

// used to roughly determine how many tests are in a file
const testPattern = /(^|\s)(it|test)\(/g;

const isCli = true;

function getArgs() {
  const [totalRunnersStr, thisRunnerStr] = process.argv.splice(2);

  if (!totalRunnersStr || !thisRunnerStr) {
    throw new Error("Missing arguments");
  }

  const totalRunners = totalRunnersStr ? Number(totalRunnersStr) : 0;
  const thisRunner = thisRunnerStr ? Number(thisRunnerStr) : 0;

  if (isNaN(totalRunners)) {
    throw new Error("Invalid total runners.");
  }

  if (isNaN(thisRunner)) {
    throw new Error("Invalid runner.");
  }

  return { totalRunners, thisRunner };
}

async function getTestCount(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return (content.match(testPattern) || []).length || 0;
}

async function getSpecFilePaths() {
  const options = specPatterns;

  const files = await globby(options.specPattern);

  const ignorePatterns = [...(options.excludeSpecPattern || [])];

  const doesNotMatchAllIgnoredPatterns = (file) => {
    const MINIMATCH_OPTIONS = { dot: true, matchBase: true };
    return ignorePatterns.every((pattern) => {
      return !minimatch(file, pattern, MINIMATCH_OPTIONS);
    });
  };

  const filtered = files.filter(doesNotMatchAllIgnoredPatterns);
  return filtered;
}

async function sortSpecFilesByTestCount(specPathsOriginal) {
  const specPaths = [...specPathsOriginal];
  const testPerSpec = {};

  for (const specPath of specPaths) {
    testPerSpec[specPath] = await getTestCount(specPath);
  }

  return Object.entries(testPerSpec)
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);
}

function splitSpecs(specs, totalRunners, thisRunner) {
  return specs.filter((_, index) => index % totalRunners === thisRunner);
}

(async () => {
  if (!isCli) {
    return;
  }

  try {
    const specFilePaths = await sortSpecFilesByTestCount(
      await getSpecFilePaths()
    );

    console.log("specFilePaths", specFilePaths);

    if (!specFilePaths.length) {
      throw Error("No spec files found.");
    }

    const { totalRunners, thisRunner } = getArgs();

    console.log("totalRunners", totalRunners);
    console.log("thisRunner", thisRunner);

    const specsToRun = splitSpecs(specFilePaths, totalRunners, thisRunner);

    console.log(specsToRun.join(","));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
