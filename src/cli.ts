import * as arg from 'arg';
import * as path from 'path';
import * as chalk from 'chalk';
import * as ncp from 'ncp';
import * as util from 'util';
import * as execa from 'execa';
import Listr = require('listr');

const { projectInstall } = require('pkg-install');
const copy = util.promisify(ncp);

function parseArgsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--template': String,
      '--name': String,
      '--ngit': Boolean,
      '-t': '--template',
      '-n': '--name',
      '-ng': '--ngit',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    template: args['--template'] || 'basic',
    name: args['--name'] || 'zigmium-project',
    templateDir: path.join(__dirname, '/starters/'),
    ngit: args['--ngit'] || false,
  };
}

async function copyTemplateFiles(options: any) {
  return copy(options.templateDir, options.outputDir, {
    clobber: false,
  });
}

async function createProject(options: any) {
  options = {
    ...options,
    outputDir: path.join(process.env.PROJECT_ROOT, options.name),
  };
  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Initialize Git',
      task: () => initGit(options),
      enabled: () => !options.ngit,
    },
    {
      title: 'Install dependencies',
      task: () =>
        projectInstall({
          cwd: options.outputDir,
        }),
    },
  ]);
  await tasks.run();
  // await copyTemplateFiles(options);
  // tslint:disable-next-line:no-console
  console.log('%s Zigmium project is ready.', chalk.green.bold('DONE'));
}

async function initGit(options: any) {
  const result = await execa('git', ['init'], {
    cwd: options.outputDir,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize Git.'));
  }
  return;
}

export async function cli(args) {
  const options = parseArgsIntoOptions(args);
  process.env.PROJECT_ROOT = process.cwd();
  options.templateDir = path.join(options.templateDir, options.template);
  await createProject(options);
}
