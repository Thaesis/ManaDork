# package.ps1
Remove-Item -Path .\build -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path .\build
Copy-Item -Path .\src -Destination .\build\src -Recurse
Copy-Item -Path .\assets -Destination .\build\assets -Recurse
Copy-Item -Path .\.env -Destination .\build\
Copy-Item -Path .\package.json -Destination .\build\
Copy-Item -Path .\package-lock.json -Destination .\build\
Copy-Item -Path .\tsconfig.json -Destination .\build\
Compress-Archive -Path .\build\* -DestinationPath .\discord-bot-package.zip -Force
Remove-Item -Path .\build -Recurse -Force