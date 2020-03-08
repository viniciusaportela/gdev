let inquirer = require('inquirer');
let clear = require('clear');
let chalk = require('chalk');
let figlet = require('figlet');
let fs = require('fs');
let join = require('path').join
let ncp = require('ncp').ncp
let clui = require('clui');

let Dependency = require('./core/Dependency');
let Godot = require('./core/Godot');
let DownloadManager = require('./core/DownloadManager');
let Cache = require('./core/Cache');

//TODO: gdcpp, godot-cpp-cli, gdcli, gdev / gddev / gd-dev

class GDev {

  constructor() {
    this.os = process.platform
    this.lastMessage = null
  }

  async start() {
    let argv = require('minimist')(process.argv)

    await Dependency.check()

    await this.menu()
  }

  async menu() {
    clear()

    console.log(chalk.blue(figlet.textSync('GDev', { horizontalLayout: 'full' })))
    if (this.lastMessage) {
      console.log(this.lastMessage);
      this.lastMessage = null;
    }

    let answer = await inquirer.prompt([{
      type: 'list',
      message: 'What do you want to do now?',
      name: 'menu',
      choices: [
        'Start a CPP Module',
        'Start a GDNative CPP Project',
        'Compile a CPP Module',
        'Compile a GDNative Module',
        'Clean Cache',
        new inquirer.Separator(),
        'Exit'
      ]
    }]).then(answer => {
      switch (answer.menu) {
        case 'Start a CPP Module': {
          this.cppModule()
        }

        case 'Start a GDNative CPP Project': {
          this.gdnative()
        }

        case 'Compile a CPP Module': {
          this.compileCpp()
        }

        case 'Compile a GDNative Module': {
          this.compileGNative()
        }

        case 'Clean Cache': {
          Cache.clean();
        }

        //Don't need for exit, since after finishing the question, there's nothing to do
        //So the program automatically closes
      }
    })
  }

  async cppModule() {
    let answers = await inquirer.prompt([
      {
        name: "branch",
        type: "list",
        message: "Which Version of Godot you would like to use?",
        choices: await DownloadManager.getGodotBranches()
      },
      {
        name: "moduleName",
        type: "input",
        message: "Name of your module (folder):",
      },
    ])

    // Download Godot Source
    await DownloadManager.downloadGodot(answers.branch)

    // Copy Files
    let { moduleName } = answers
    let destination = `./${moduleName}`

    if (!fs.existsSync(destination))
      fs.mkdirSync(destination);

    let spinner = new clui.Spinner('Copying Files', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    spinner.start();

    await (async _ => (
      new Promise((resolve, reject) =>
        ncp(join(__dirname, `./cache/godot/${answers.branch}/godot-${answers.branch}`), destination, err => {
          if (err) reject();
          resolve();
        })
      )
    ))();

    console.log(`${chalk.green('🗸')} Files Copied`);

    // Create Module
    spinner.message('Creating Module');
    fs.mkdirSync(`./${destination}/modules/${moduleName}`);

    // Copy Default Files
    fs.copyFileSync(join(__dirname, './default/SCsub'), `${destination}/modules/${moduleName}/SCsub`);
    fs.copyFileSync(join(__dirname, './default/config.py'), `${destination}/modules/${moduleName}/config.py`);
    fs.copyFileSync(join(__dirname, './default/base.h'), `${destination}/modules/${moduleName}/base.h`);
    fs.copyFileSync(join(__dirname, './default/base.cpp'), `${destination}/modules/${moduleName}/base.cpp`);
    fs.copyFileSync(join(__dirname, './default/register_types.h'), `${destination}/modules/${moduleName}/register_types.h`);
    fs.copyFileSync(join(__dirname, './default/register_types.cpp'), `${destination}/modules/${moduleName}/register_types.cpp`);

    // Last Step, Rename Some Files Content
    let header = fs.readFileSync(`${destination}/modules/${moduleName}/register_types.h`, 'utf-8');
    header.replace(/(\?)/gm, moduleName)
    //TODO: Save File
    
    let cpp = fs.readFileSync(`${destination}/modules/${moduleName}/register_types.cpp`, 'utf-8');
    cpp.replace(/(\?)/gm, moduleName)

    spinner.stop();

    //TODO: Change to "press any key to continue"
    this.lastMessage = `${chalk.green('🗸 Module Created Successfully ')}\n`;

    // Open VSCode

    this.menu();
  }

  async gdnative() {
    // Create .vscode configuration for C/C++ Plugin
  }

  async compileCpp() {

  }

  async compileGNative() {

  }

}

new GDev().start()