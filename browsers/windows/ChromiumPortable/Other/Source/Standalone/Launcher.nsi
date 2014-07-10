# Chromium Portable — Standalone launcher
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


###################
# Global variables:
#   $0 - Temporary directory
#   $1 - Additional parameters
#   $2 - Path (without drive letter or share) to the user data package
#   $3 - 1 if PortablePasswords is enabled; 0 otherwise
#   $4 - Master password for PortablePasswords


####################################
# Launcher executable's attributes #
####################################

# App info
!define AppName         "Chromium"
!define AppExePath      "Chromium|Chrome.exe"
!define PortableAppName "Chromium Portable"
!define PortableAppID   "ChromiumPortable"

# Attributes
Name    "${PortableAppName}"
Caption "${PortableAppName}"
Icon    "..\..\..\App\AppInfo\AppIcon.ico"
OutFile "..\..\..\${PortableAppID}.exe"

# Version information
!define AddCommonVersionInfo
!include ..\Version.nsh
VIAddVersionKey FileDescription  "${PortableAppName}'s standalone launcher"
VIAddVersionKey Comments         "Allows the ${AppName} web browser to be run from a removable drive"
VIAddVersionKey OriginalFilename "${PortableAppID}.exe"
VIAddVersionKey InternalName     "${PortableAppID}Standalone"

# Runtime switches
CRCCheck              Force
SilentInstall         Silent
AutoCloseWindow       True
RequestExecutionLevel User
;TargetMinimalOS       5.1

# Compression
!ifdef NoCompress
	SetCompress Off
!else
	SetCompressor /SOLID LZMA
	SetCompressorDictSize 64
!endif
SetDateSave Off


##################
# Path variables #
##################

!macro DefinePath id dir name
	!define ${id}Dir  "${dir}"
	!define ${id}File "${name}"
	!define ${id}Path "${dir}\${name}"
!macroend

# Files and directories
!define AppDir   "$0\App"
!define DataDir  "$0\Data"
!insertmacro DefinePath UserConfig   $PLUGINSDIR "${PortableAppID}.ini"
!insertmacro DefinePath InstanceList $TEMP       "${PortableAppID}Instances.dat"

# Path to the executable
!searchparse "${AppExePath}" "" AppExeDir "|" AppExeFile ""


############
# Includes #
############

!include LogicLib.nsh
!include TextFunc.nsh
!include WordFunc.nsh

!include ..\Utils.nsh

!include Modules\Instances.nsh
!include Modules\Passwords.nsh
!include Modules\Payload.nsh
!include Modules\Settings.nsh
!include Modules\Splash.nsh


#########################
# Launcher localization #
#########################

!include Languages\English.nsh
!include Languages\PortugueseBR.nsh


###################################
# Initialization and finalization #
###################################

Function .onInit
	# Get the *path* (i.e. without drive letter or share) to the user data package
	GetFullPathName $R0 "${Payload.UserData}"
	${GetRoot} $R0 $R1
	StrLen $R2 $R1
	StrCpy $2 $R0 "" $R2

	# Log session info
	${LogInit} `${PortableAppName} standalone launcher v${PackageVersion}$\r$\nBuilt with NSIS ${NSIS_VERSION} at ${__DATE__} ${__TIME__}$\r$\nRunning from "$EXEDIR" as "$EXEFILE"$\r$\nUser data package: $2`

	# Check if the payload is already being used
	!insertmacro Instances.CheckPayloadMutex

	# Just in case it's not already empty
	StrCpy $1 ""
FunctionEnd

Function Exit
	# Remove the temporary directory
	${Log} "Removing temporary directory $0"
	SetOutPath $EXEDIR
	RMDir /R $0

	# Remove ourselves from the instances list, and delete the file if we're the last instance
	${ConfigWrite} "${InstanceListPath}" "$2=" "" $R0
	${GetSize} "${InstanceListDir}" "/M=${InstanceListFile} /S=0B /G=0" $R0 $R1 $R2
	${If} $R0 <= 2 # CRLF
		${Log} "Deleting instance list file ${InstanceListPath}"
		Delete "${InstanceListPath}"
	${EndIf}

	# Stop the splash screen and unload its plugin
	!insertmacro Splash.Stop
	Sleep 250
	!insertmacro Splash.Unload
	${LogEnd}
	Abort
FunctionEnd

Function AbortLauncher
	${Log} "Launcher aborted by user"
	Call Exit
FunctionEnd


###############
# Entry point #
###############

Section
	# Initialize the main temporary directory and change to it
	GetTempFileName $0
	Delete $0
	CreateDirectory $0
	${Log} "Main temporary directory set to $0"

	InitPluginsDir
	!insertmacro Payload.ExtractConfigFile

	!insertmacro Splash.Show Startup

	# Extract the application and the user's data
	!insertmacro Payload.ExtractApplication
	!insertmacro Instances.CheckCrash # Try to recover data from a crashed launch
	Pop $R0
	${If} $R0 != "true"
		# No crashed launch; proceed with the extraction
		!insertmacro Payload.ExtractUserData
	${EndIf}
	!insertmacro Payload.CopyAppAddons

	# Mark our instance as handling this user data package
	${ConfigWrite} "${InstanceListPath}" "$2=" $0 $R0

	# Setup the environment and check settings
	!insertmacro Settings.CheckIncognito
	!insertmacro Settings.CheckParameters
	!insertmacro Settings.FindJava
	!insertmacro Settings.ExportAPIKeys

	# Set the path to the data directory
	System::Call `Kernel32::SetEnvironmentVariable(t"CrPortableDataDirectory", t"${DataDir}")`

	!insertmacro Splash.Stop

	# Decrypt portable passwords
	!insertmacro Passwords.GetMasterPassword
	!insertmacro Passwords.Decrypt

	# Run the app
	${AppendCommandLinePath} "disk-cache-dir" "$0\Cache"
	${Quote} $R0 "${AppDir}\${AppExeFile}"
	${Log} "Running $R0$1"
	ExecWait "$R0$1"
	${Log} "${AppExeFile} finished running"

	# Encrypt portable passwords
	!insertmacro Passwords.Encrypt

	!insertmacro Splash.Show Shutdown

	# Update the user data package
	!insertmacro Payload.UpdateUserData

	Call Exit
SectionEnd
