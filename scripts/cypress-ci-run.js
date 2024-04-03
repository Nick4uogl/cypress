import { exec } from "child_process";

function getEnvNumber(varName, { required = false } = {}) {
  if (required && process.env[varName] === undefined) {
    throw Error(`${varName} is not set.`);
  }

  const value = Number(process.env[varName]);

  if (isNaN(value)) {
    throw Error(`${varName} is not a number.`);
  }

  return value;
}

function getArgs() {
  return {
    totalRunners: getEnvNumber("TOTAL_RUNNERS", { required: true }),
    thisRunner: getEnvNumber("THIS_RUNNER", { required: true }),
  };
}

(async () => {
  try {
    const { totalRunners, thisRunner } = getArgs();

    const command = `npx cypress run --spec "$(node scripts/cypress-spec-split.ts ${totalRunners} ${thisRunner})"`;

    console.log(`Running: ${command}`);

    const commandProcess = exec(command);

    if (commandProcess.stdout) {
      commandProcess.stdout.pipe(process.stdout);
    }

    if (commandProcess.stderr) {
      commandProcess.stderr.pipe(process.stderr);
    }

    commandProcess.on("exit", (code) => {
      process.exit(code || 0);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
