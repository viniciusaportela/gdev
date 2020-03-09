@echo off
echo Starting Installation ...

::Setup Env Variables
::npm install --save
setx GDEV "%~dp0
setx path "%GDEV%bin;%path%"

node -v >nul 2>nul && (
  echo Executing gdev ...
  node "%GDEV%gdev"
  exit
) || (
  echo Node wasn't found, trying to download ...

  powershell -Command "Invoke-WebRequest https://nodejs.org/dist/v12.16.1/node-v12.16.1-x64.msi -OutFile 'C:\Users\Vinicius Araujo\Downloads\node.msi'"
  "C:\Users\Vinicius Araujo\Downloads\node.msi"
  echo Executing gdev ...
  node "%GDEV%gdev"
)