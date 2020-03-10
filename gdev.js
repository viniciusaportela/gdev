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
const DownloadManager = require('./core/DownloadManager');
const Cache = require('./core/Cache');
const { createDirs, copyFolder } = require('./core/utils');

class GDev {

  constructor() {
    this.os = process.platform;
    this.curMenu;
    this.runningProcesses = [];
  }

  async start() {
    let argv = require('minimist')(process.argv);

    await Dependency.check();

    await this.menu()
  }

  async menu() {
    clear();

    console.log(colors.blue(figlet.textSync('GDev', { horizontalLayout: 'full' })));
    console.log(colors.blue('DIR: '), process.cwd() + '\n');

    inquirer.prompt([{
      type: 'list',
      message: 'What do you want to do?',
      name: 'menu',
      choices: [
        'Start a CPP Module',
        'Compile a CPP Module',
        'Start a GDNative CPP Project',
        'Watch a GDNative Module (Compile at Every Change)',
        //TODO: Clean Cache
        new inquirer.Separator(),
        'Change Working Dir',
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
          break; 2
        }

        case 'Clean GDev Cache': {
          this.cleanCache();
          break;
        }

        case 'Change Working Dir': {
          this.changeDir();
          break;
        }

        // Don't need for exit, since after finishing the question, there's nothing to do
        // So the program automatically closes
      }
    });
  }

  async changeDir() {
    clear();

    let ans = await inquirer.prompt({
      name: 'dir',
      type: 'input',
      message: 'Change current working dir to:'
    });

    process.chdir(ans.dir);
    await this.menu();
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
    fs.copyFileSync(join(__dirname, './default/cppmodule/SCsub'), `${destination}/modules/${moduleName}/SCsub`);
    fs.copyFileSync(join(__dirname, './default/cppmodule/config.py'), `${destination}/modules/${moduleName}/config.py`);
    fs.copyFileSync(join(__dirname, './default/cppmodule/base.h'), `${destination}/modules/${moduleName}/base.h`);
    fs.copyFileSync(join(__dirname, './default/cppmodule/base.cpp'), `${destination}/modules/${moduleName}/base.cpp`);
    fs.copyFileSync(join(__dirname, './default/cppmodule/register_types.h'), `${destination}/modules/${moduleName}/register_types.h`);
    fs.copyFileSync(join(__dirname, './default/cppmodule/register_types.cpp'), `${destination}/modules/${moduleName}/register_types.cpp`);

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
    let config = fs.readFileSync(join(__dirname, './default/cppmodule/c_cpp_properties.json'), 'utf-8');

    let configRegex = new RegExp(/\^\?\^/, 'gm');
    //TODO: Create Function for this
    config = (() => {
      let path = require('path').resolve(`./`);

      if (this.os === 'win32') {
        let regex = new RegExp(/\\/, 'gm');
        return config.replace(configRegex, path.replace(regex, '\\\\') + '\\\\**')
      } else {
        return config.replace(configRegex, path + '/**')
      }
    })();

    fs.writeFileSync('./.vscode/c_cpp_properties.json', config);

    // Finished
    spinner.stop();
    await pressAnyKey('Press any key to continue ...');
    await this.menu();
  }

  /**
   * Creates GDNative Project
   */
  async gdnative() {
    let spinner = new clui.Spinner('', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    let curDir = process.cwd();
    let os = (() => {
      let osList = {
        win32: "windows",
        linux: "linux"
      }

      return osList[this.os];
    })();

    let answers = await inquirer.prompt([
      {
        name: "projectName",
        type: "input",
        message: "Name of your project (folder):",
      },
    ]);

    await DownloadManager.downloadGodotCpp();
    await DownloadManager.downloadGodotHeaders();

    // Mount CPP Bindings (Folder and Compile)
    // Unmounted -> Mounted -> Compiled
    if (Cache.get('gdnative', 'cpp') === 'compiled') {
      console.log(colors.yellow('> CPP Bindings already compiled'));
    } else {
      //Start Process
      spinner.message('Generating CPP Bindings (1/3)');
      spinner.start();

      if (Cache.get('gdnative', 'cpp') === 'mounted') {
        spinner.stop();
        console.log(colors.yellow('> CPP Bindings already mounted'));
        spinner.start();
      } else {
        Cache.set('gdnative', 'cpp', 'unmounted');
        Cache.createDir('gdnative/cpp/master');

        // First, Copy Godot-CPP
        await (() => {
          return new Promise((resolve, reject) => {
            ncp(join(__dirname, './cache/godotcpp/master/godot-cpp-master'), join(__dirname, './cache/gdnative/cpp/master/'), err => {
              if (err) reject(err);
              resolve();
            })
          });
        })();

        // Then, Copy Godot-Headers
        spinner.message('Generating CPP Bindings (2/3)');
        await (() => {
          return new Promise((resolve, reject) => {
            ncp(join(__dirname, './cache/godotheaders/master/godot_headers-master'), join(__dirname, './cache/gdnative/cpp/master/godot_headers'), err => {
              if (err) reject(err);
              spinner.stop();
              console.log(`${colors.green('🗸 Files Mounted ')}`);
              spinner.start();
              resolve();
            })
          });
        })();

        Cache.set('gdnative', 'cpp', 'mounted');
        spinner.stop();
      }

      // Finally, Compile Bindings
      spinner.start();
      spinner.message('Generating CPP Bindings (3/3)');

      if (os) {
        let execDir = process.cwd()
        process.chdir(join(__dirname, './cache/gdnative/cpp/master/'))
        shell.exec(`scons platform=${os} generate_bindings=yes`)
        process.chdir(execDir)
      } else {
        spinner.stop();
        console.log(colors.red('Not support for you system yet (just win32 / linux)'));
        spinner.start();
      }

      spinner.stop();
      Cache.set('gdnative', 'cpp', 'compiled');
      console.log(`${colors.green('🗸 GDNative CPP Compiled (Next Projects are going to be created much faster)')}`);
    }

    // Create Module
    spinner.message('Creating Module (1/5)');
    spinner.start();

    createDirs(require('path').resolve(`./${answers.projectName}/godot-cpp/bin`));
    fs.mkdirSync(`./${answers.projectName}/godot-cpp/godot_headers`);
    fs.mkdirSync(`./${answers.projectName}/godot-cpp/include`);
    fs.mkdirSync(`./${answers.projectName}/godot-project`);
    fs.mkdirSync(`./${answers.projectName}/godot-project/bin`);
    fs.mkdirSync(`./${answers.projectName}/src`);

    spinner.message('Creating Module (2/5)');
    await copyFolder(join(__dirname, './cache/gdnative/cpp/master/bin'), `./${answers.projectName}/godot-cpp/bin`);
    await copyFolder(join(__dirname, './cache/gdnative/cpp/master/godot_headers'), `./${answers.projectName}/godot-cpp/godot_headers`);
    await copyFolder(join(__dirname, './cache/gdnative/cpp/master/include'), `./${answers.projectName}/godot-cpp/include`);

    // Create Godot Project
    spinner.message('Creating Module (3/5)');
    process.chdir(join(curDir, `./${answers.projectName}/godot-project`));
    shell.touch('project.godot');

    // Copy Default Files (+gdnlib, +gdns, SConstruct)
    spinner.message('Creating Module (4/5)');
    process.chdir(join(curDir, `./${answers.projectName}`));
    fs.copyFileSync(join(__dirname, './default/gdnative/SConstruct'), `./SConstruct`);
    fs.copyFileSync(join(__dirname, './default/gdnative/gdlibrary.cpp'), `./src/gdlibrary.cpp`);
    fs.copyFileSync(join(__dirname, './default/gdnative/base.cpp'), `./src/base.cpp`);
    fs.copyFileSync(join(__dirname, './default/gdnative/base.h'), `./src/base.h`);

    spinner.stop();
    console.log(`${colors.green('🗸 Files Copied')}`);
    spinner.start();

    // Create .vscode
    spinner.message('Creating Module (4/5)');
    fs.mkdirSync('./.vscode');
    let config = fs.readFileSync(join(__dirname, './default/gdnative/c_cpp_properties.json'), 'utf-8');

    let configRegex = new RegExp(/\^\?\^/, 'gm');
    //TODO: Create Function for this
    config = (() => {
      let path = require('path').resolve(`./`);

      if (this.os === 'win32') {
        let regex = new RegExp(/\\/, 'gm');
        return config.replace(configRegex, path.replace(regex, '\\\\') + '\\\\**')
      } else {
        return config.replace(configRegex, path + '/**')
      }
    })();

    fs.writeFileSync('./.vscode/c_cpp_properties.json', config);

    // Compile
    spinner.message('Creating Module (5/5)');
    if (os) {
      let scons = shell.exec(`scons p=${os}`, { silent: true });
      if (scons.code !== 0) {
        spinner.stop();
        console.log(colors.red('> Error when running scons!'));
        console.log(scons.stdout);
        spinner.start();
      } else {
        spinner.stop();
        console.log(`${colors.green('🗸 Scons Compiled ')}`);
        spinner.start();
      }
    }

    // Open Godot Editor
    process.chdir(join(curDir, `./${answers.projectName}/godot-project/`));
    if (shell.exec('godot -e', { silent: true }).code !== 0) {
      console.log(colors.red('godot command not acessable'));
    }

    // Open VSCODE
    process.chdir(join(curDir, `./${answers.projectName}`));
    shell.exec('code .');

    process.chdir(join(curDir, `./${answers.projectName}/src`));

    spinner.stop();
    console.log(`${colors.green('🗸 GDNative Project Created Successfully! ')}`);
    await pressAnyKey('Press any key to continue ...');
    await this.menu();
  }

  async compileCpp() {
    if (this.os === 'win32') {
      shell.exec('scons platform=windows');
    } else {
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

  //TODO: Scripts

  async runScript() {

  }

  async addScript() {

  }

  async createScript() {

  }

}

new GDev().start()