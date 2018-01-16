$isTestnet = $true

Write-Host "Started creation of Windows packages"

(Get-Content ..\Gruntfile.js).replace('0.14.7', '0.24.3') | Set-Content ..\Gruntfile.js
Write-Host "Chanaged nwjs version"

cd ..\
$currentProjectDirectory = (Get-Item -Path ".\" -Verbose).FullName
Remove-Item .\node_modules -Force -Recurse

bower install
Write-Host "Bower install completed"

npm install
Write-Host "Npm install completed"

grunt
Write-Host "Grunt completed"

Remove-Item ..\byteballbuilds -Force -Recurse
Write-Host "Removed old byteballbuilds"

Copy-Item -Path "$($currentProjectDirectory)\devbuilds\sqlite3\*" -Destination "$($currentProjectDirectory)\node_modules\sqlite3\lib\binding" -recurse -Force
Write-Host "Copied sqlite3 lib bindings"

if ($isTestnet) {
  (Get-Content "$($currentProjectDirectory)\node_modules\byteballcore\constants.js").replace("exports.version = '1.0';", "exports.version = '1.0t';") | Set-Content "$($currentProjectDirectory)\node_modules\byteballcore\constants.js"
  (Get-Content "$($currentProjectDirectory)\node_modules\byteballcore\constants.js").replace("exports.alt = '1';", "exports.alt = '2';") | Set-Content "$($currentProjectDirectory)\node_modules\byteballcore\constants.js"
  Write-Host "testnetified byteballcore constants"
  
  grunt desktop:testnet
  Write-Host "Grunt desktop completed"
  
  Write-Host "Started copying node_modules"
  Copy-Item -Path "$($currentProjectDirectory)\node_modules" -Destination ..\byteballbuilds\Dagcoin-TN\win32\ -recurse -Force
  Copy-Item -Path "$($currentProjectDirectory)\node_modules" -Destination ..\byteballbuilds\Dagcoin-TN\win64\ -recurse -Force
  Write-Host "Copied node_modules"
  
  Write-Host "Started grunt inno task"
  grunt inno64:testnet
  grunt inno32:testnet
  Write-Host "Completed grunt inno task"
} else {
  grunt desktop:live
  Write-Host "Grunt desktop completed"
  
  Write-Host "Started copying node_modules"
  Copy-Item -Path "$($currentProjectDirectory)\node_modules" -Destination ..\byteballbuilds\Dagcoin\win32\ -recurse -Force
  Copy-Item -Path "$($currentProjectDirectory)\node_modules" -Destination ..\byteballbuilds\Dagcoin\win64\ -recurse -Force
  Write-Host "Copied node_modules"
  
  Write-Host "Started grunt inno task"
  grunt inno64:live
  grunt inno32:live
  Write-Host "Completed grunt inno task"
}
