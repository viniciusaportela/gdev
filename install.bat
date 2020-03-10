@echo off
echo Starting Installation ...

::Setup Env Variables
setx GDEV "%~dp0
setx path "%GDEV%bin;%path%"

::Check for Scoop
where scoop >nul 2>nul && (
  ::Install all dependencies
  echo Installing all needed dependencies
  scoop install nodejs gcc python scons yasm make

  echo Installing Node Project Dependencies ...
  npm install --save
  echo Executing gdev ...
  node "%GDEV%gdev"
) || (
  ::Install all dependencies
  echo scoop not found, installing it!
  powershell -Command "Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://get.scoop.sh')"
  echo Installing all needed dependencies
  scoop install nodejs gcc python scons yasm make

  echo Installing Node Project Dependencies ...
  npm install --save
  echo Executing gdev ...
  node "%GDEV%gdev"
)