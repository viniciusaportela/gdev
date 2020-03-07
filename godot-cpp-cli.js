let inquirer = require('inquirer')
let clear = require('clear')
let chalk = require('chalk')
let figlet = require('figlet')

let Dependency = require('./core/Dependency')
let Godot = require('./core/Godot')
let DownloadManager = require('./core/DownloadManager')

class GodotCPPCli {

  constructor() {
    this.os = process.platform
  }

  async start() {
    let argv = require('minimist')(process.argv);

    await Dependency.check()

    await this.menu()
  }

  async menu() {
    clear()
    console.log(chalk.blue(figlet.textSync('Godot CPP CLI', { horizontalLayout: 'full' })))

    let answer = await inquirer.prompt([{
      type: 'list',
      message: 'What do you want to do now?',
      name: 'menu',
      choices: [
        'Starts a CPP Module',
        'Starts a GDNative CPP Project',
        'Compile a CPP Module',
        'Compile a GDNative Module',
        'Clean Cache',
        new inquirer.Separator(),
        'Exit'
      ]
    }]).then(answer => {
      switch (answer.menu) {
        case 'Starts a CPP Module': {
          this.cppModule()
        }

        case 'Starts a GDNative CPP Project': {
          this.gdnative()
        }

        //Don't need for exit, since after finishing the question, there's nothing to do
        //So the program automatically closes
      }
    })
  }

  async cppModule() {
    var CLI = require('clui'),
      Spinner = CLI.Spinner;

    var countdown = new Spinner('Checking for cache', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    countdown.start()

    // Download Godot Source
    DownloadManager.downloadGodot()

    countdown.stop()
  }

  async gdnative() {

  }

}

new GodotCPPCli().start()