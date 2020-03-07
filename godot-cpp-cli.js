let inquirer = require('inquirer')
let clear = require('clear')

class GodotCPPCli {

  menu() {

  }

}

inquirer.prompt([{
  type: 'list',
  message: 'What do you want to do now ?',
  name: 'menu',
  choices: [
    'Starts a CPP Module',
    'Starts a GDNative CPP Project',
    new inquirer.Separator(),
    'Exit'
  ]
}]).then(answers => {
  clear()
  answers[0]
})