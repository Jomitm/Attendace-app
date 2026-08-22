Set objShell = CreateObject("WScript.Shell")
objShell.Run "cmd.exe /K cd /D """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npm install --include=dev && echo. && echo Starting Vite on http://localhost:3000 && npx vite", 1, False
