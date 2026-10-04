Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\start_bot.bat"
WshShell.Run """" & batPath & """", 0, False
Set WshShell = Nothing
Set fso = Nothing
