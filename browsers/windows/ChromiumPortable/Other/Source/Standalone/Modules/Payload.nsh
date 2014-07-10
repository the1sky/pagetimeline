# Chromium Portable — Payloads (application and user data) module
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


!ifdef UDA
	!define Payload.UserData "$EXEDIR\${UDA}"
!else
	!define Payload.UserData "$EXEDIR\${PortableAppID}.7z"
!endif


# Extract the launcher's config file
!macro Payload.ExtractConfigFile
	# Extract 7-Zip
	File "/oname=$PLUGINSDIR\7zr.exe" "..\7zr.exe"

	# Check if the user data package exists and extract the config file
	${If} ${FileExists} "${Payload.UserData}"
		${Log} "Extracting config file to ${UserConfigPath}"
		ExecDos::Exec `"$PLUGINSDIR\7zr.exe" e -o"${UserConfigDir}" "${Payload.UserData}" "${UserConfigFile}"` "" ""
	${EndIf}
!macroend

# Extract the application
!macro Payload.ExtractApplication
	${Log} "Extracting application to ${AppDir}"
	SetOutPath "${AppDir}"
	File /R "..\..\..\App\${AppExeDir}\*.*"
	SetOutPath $0
!macroend

# Extract the user data package
!macro Payload.ExtractUserData
	# Create the data directory
	CreateDirectory "${DataDir}"

	# Check if the user data package exists and extract it
	${If} ${FileExists} "${Payload.UserData}"
		${Log} "Extracting user data to ${DataDir}"
		ExecDos::Exec `"$PLUGINSDIR\7zr.exe" x -o"${DataDir}" "${Payload.UserData}"` "" ""
		Pop $R0
		${If} $R0 > 1 # Something went wrong; lets get out here while we still can…
			!insertmacro Splash.Stop
			${Log} "Failed to extract the user's data (7zr's exit code $R0)"
			MessageBox MB_OK|MB_ICONSTOP $(CannotExtractUserData)
			Call Exit
		${EndIf}
	${EndIf}
!macroend

# Copy application addons
!macro Payload.CopyAppAddons
	${If} ${FileExists} "${DataDir}\App\*.*"
		# There are addons available; copy them to the app"s folder
		CopyFiles /SILENT "${DataDir}\App\*.*" "${AppDir}"
	${EndIf}
	
	# Check for PPAPI Flash Player
	${If} ${FileExists} "${AppDir}\PepperFlash\PEPFlashPlayer.dll"
		${ConfigRead} "${AppDir}\PepperFlash\Manifest.json" `    "version": ` $R0
		StrCpy $R0 $R0 -3 1
		${AppendCommandLinePath} "ppapi-flash-path" "${AppDir}\PepperFlash\PEPFlashPlayer.dll"
		${AppendCommandLinePath} "ppapi-flash-version" "$R0"
	${EndIf}
!macroend

# Update the user data package
!macro Payload.UpdateUserData
	# Get the 7-Zip compression options
	StrCpy $R0 ""
	${ReadUserConfig} $R0 "7zOptions"
	# Update the package
	${Log} "Updating the user data package; extra 7zr arguments: $R0"
	ExecDos::Exec `"$PLUGINSDIR\7zr.exe" u -uq0 $R0 "${Payload.UserData}" "${DataDir}\*"` "" ""
	Pop $R0
	${If} $R0 > 1 # Something went wrong
		${Log} "Failed to update the user data package (7zr's exit code $R0)"
		# Copy the data for later recovery
		GetTempFileName $R0
		Delete $R0
		CreateDirectory $R0
		${Log} "Transferring user data to $R0"
		CopyFiles /SILENT "${DataDir}\*.*" $R0
		!insertmacro Splash.Stop
		MessageBox MB_OK|MB_ICONSTOP $(CannotUpdateUserDataPackage)
		Call Exit
	${EndIf}
!macroend
