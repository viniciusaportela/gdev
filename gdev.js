const inquirer = require('inquirer');
const clear = require('clear');
const figlet = require('figlet');
const fs = require('fs');
const join = require('path').join;
const ncp = require('ncp').ncp;
const colors = require('colors');
const clui = require('clui');
const shell = require('shelljs');
const pressAnyKey = require('press-any-key');

const Dependency = require('./core/Dependency');
const Godot = require('./core/Godot');
const DownloadManager = require('./core/DownloadManager');
const Cache = require('./core/Cache');

class GDev {

  constructor() {
    this.os = process.platform
    this.runningProcesses = []
  }

  async start() {
    let argv = require('minimist')(process.argv)

    await Dependency.check()

    await this.menu()
  }

  async menu() {
    clear()
    
    console.log(colors.blue(figlet.textSync('GDev', { horizontalLayout: 'full' })))
    console.log(colors.blue('DIR: '), process.cwd() + '\n');

    let answer = await inquirer.prompt([{
      type: 'list',
      message: 'What do you want to do?',
      name: 'menu',
      choices: [
        'Start a CPP Module',
        'Start a GDNative CPP Project',
        'Compile a CPP Module',
        'Watch a GDNative Module (Compile at Every Change)',
        //TODO: Clean Cache
        new inquirer.Separator(),
        'Exit',
      ]
    }]).then(answer => {
      switch (answer.menu) {
        case 'Start a CPP Module': {
          this.cppModule()
          break;
        }

        case 'Start a GDNative CPP Project': {
          this.gdnative()
          break;
        }

        case 'Compile a CPP Module': {
          this.compileCpp()
          break;
        }

        case 'Watch a GDNative Module (Compile at Every Change)': {
          this.watchGDnative()
          break;2
        }

        case 'Clean GDev Cache': {
          this.cleanCache();
          break;
        }

        // Don't need for exit, since after finishing the question, there's nothing to do
        // So the program automatically closes
      }
    })
  }

  async cppModule() {
    let answers = await inquirer.prompt([
      {
        name: "moduleName",
        type: "input",
        message: "Name of your module (folder):",
      },
      {
        name: "branch",
        type: "list",
        message: "Which Version of Godot you would like to use?",
        choices: await DownloadManager.getGodotBranches()
      },
    ]);

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

    spinner.stop()
    console.log(colors.green('🗸 Files Copied '));
    spinner.start()

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
    let regex = new RegExp(/\?/, 'gm');

    let header = fs.readFileSync(`${destination}/modules/${moduleName}/register_types.h`, 'utf-8');
    header = header.replace(regex, moduleName);
    fs.writeFileSync(`${destination}/modules/${moduleName}/register_types.h`, header);

    regex.lastIndex = 0;

    let cpp = fs.readFileSync(`${destination}/modules/${moduleName}/register_types.cpp`, 'utf-8');
    cpp = cpp.replace(regex, moduleName);
    fs.writeFileSync(`${destination}/modules/${moduleName}/register_types.cpp`, cpp);
    
    console.log(`${colors.green('🗸 Module Created Successfully ')}`);

    // Open VSCode
    shell.exec(`code ${destination}`, { silent: true });
    process.chdir(`./${destination}`);

    // Setup .vscode configuration
    fs.mkdirSync('.vscode');
    let config = fs.readFileSync(join(__dirname, './default/c_cpp_properties.windows.json'), 'utf-8');
    
    let configRegex = new RegExp(/\^\?\^/, 'gm');
    //TODO: Create Function for this
    config = (() => {
      let path = require('path').resolve(`./`);

      if (this.os === 'win32'){  
        let regex = new RegExp(/\\/, 'gm');
        return config.replace(configRegex, path.replace(regex, '\\\\') + '\\\\**')
      }else{
        return config.replace(configRegex, path + '/**')
      }
    })();
    
    fs.writeFileSync('./.vscode/c_cpp_properties.json', config);

    // Finished
    spinner.stop();
    await pressAnyKey('Press any key to continue');
    await this.menu();
  }

  async gdnative() {
    let answers = await inquirer.prompt([
      {
        name: "projectName",
        type: "input",
        message: "Name of your project (folder):",
      },
    ]);

    await DownloadManager.downloadGodotCpp();
    await DownloadManager.downloadGodotHeaders();

    // Unzip
    
    // Bindings

    // Create Module

    // Create Godot Project

    // Copy Default Files (+gdnlib, +gdns)

    // Compile

    // Open Godot Project

    // Open VSCODE

    await this.menu();
  }

  async compileCpp() {
    if(this.os === 'win32') {
      shell.exec('scons platform=windows');
    }else{
      console.log('not supported yet');
    }

    await this.menu();
  }

  async watchGDnative() {
    await this.menu();
  }

  async cleanCache() {
    Cache.clean();
    await this.menu();
  }

  // Scripts

  async runScript() {

  }

  async addScript() {

  }

  async createScript() {

  }

}

new GDev().start()