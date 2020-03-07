let inquirer = require('inquirer')
let fs = require('fs')
let axios = require('axios')

class DownloadManager {

  static async downloadGodot() {
    let answer = await inquirer.prompt([{
      name: "branch",
      message: "Which Version of Godot you would like to use?",
      choices: await this.getGodotBranches()
    }])

    // Check has cache
    if (fs.existsSync('./cache/godot.json')) {
      // Check if Godot was already downloaded
    }
  }

  static async getGodotBranches() {
    // Download
    var res = await axios.get('https://api.github.com/repos/godotengine/godot/branches')
    console.log(res.data);
    return res.data.map(branch => (branch.name))
  }

}

module.exports = DownloadManager