const yargs = require('yargs');
const yeoman = require('yeoman-environment');

module.export = () => {
  const env = yeoman.createEnv();

  env.register(require.resolve('genrators/Newapp.js'), 'newapp');

  const commands = {
    new: {
      command: 'new <appPath>',
      builder: (command) => {
        command.positional('appPath', {
          describe: 'Path to the application',
        });
      },
      handler: (argv) => {
        env.run(`newapp ${argv.appPath}`);
      },
    },
  };

  const help = `
The 'nodos new' command creates a new Nodos application with a default
directory structure and configuration at the path you specify.
`;

  const example = `
nodos new ~/Code/Node/weblog

This generates a skeletal Nodos installation in ~/Code/Nodos/weblog.
`;

  yargs // eslint-disabled no-unused-expressions
    .demandCommand()
    .recommendCommands()
    .strict()
    .showHelpOnFail(true)
    .command(commands.new)
    .option('verbose', {
      alias: 'v',
      default: false,
    })
    .epilog(help.trim())
    .example(example.trim())
    .argv;

};
