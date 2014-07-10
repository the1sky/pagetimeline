# Chromium Portable — Settings module
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


# If the AskForIncognito option is enabled, ask the user to start
# in incognito mode
!macro Settings.CheckIncognito
	${If} ${IsUserOptionTrue} "AskForIncognito"
		!insertmacro Splash.Stop
		MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 $(RunInIncognitoMode) IDNO +2
			${AppendCommandLineSwitch} "incognito"
	${EndIf}
!macroend


# Append additional parameters (from config file and command-line) to the
# launch command-line
!macro Settings.CheckParameters
	${ReadUserConfig} $R0 "AdditionalParameters"
	${Log} "Additional parameters from config file: $R0"
	${AppendCommandLineValues} $R0
	${GetParameters} $R0
	${Log} "Additional parameters from command-line: $R0"
	${AppendCommandLineValues} $R0
!macroend


# If the Java install at $R0 is valid, pass it into the command line and
# go to a specific label
!macro _Settings.CheckJavaInstall_
	${Log} "Checking Java install at $R0"
	${If} ${FileExists} "$R0\Bin\New_Plugin\npJP2.dll"
		${Log} "Found Java install at $R0"
		System::Call `Kernel32::SetEnvironmentVariable(t"Java_Home", tR0)`
		${AppendCommandLinePath} "extra-plugin-dir" "$R0\Bin\New_Plugin"
		Goto _Settings.FindJava!End_
	${OrIf} ${FileExists} "$R0\Bin\Plugin2\npJP2.dll"
		${Log} "Found Java install at $R0"
		System::Call `Kernel32::SetEnvironmentVariable(t"Java_Home", tR0)`
		${AppendCommandLinePath} "extra-plugin-dir" "$R0\Bin\Plugin2"
		Goto _Settings.FindJava!End_
	${EndIf}
!macroend

# Find a valid Java install and load its plugins
!macro Settings.FindJava
	# Check for a Java path…

	# …from the config file
	${ReadUserConfig} $R0 "JavaHome"
	${IfNot} ${Errors}
		SetOutPath $EXEDIR
		GetFullPathName $R0 $R0
		SetOutPath $0
		!insertmacro _Settings.CheckJavaInstall_
	${EndIf}

	# …from %Java_Home%
	ReadEnvStr $R0 "Java_Home"
	!insertmacro _Settings.CheckJavaInstall_

	# …from ..\CommonFiles
	GetFullPathName $R0 "$EXEDIR\..\CommonFiles\Java"
	!insertmacro _Settings.CheckJavaInstall_

	# …from %Path%
	ClearErrors
	SearchPath $R0 "Java.exe"
	${IfNot} ${Errors}
		GetFullPathName $R0 "$R0\..\.."
		!insertmacro _Settings.CheckJavaInstall_
	${EndIf}
_Settings.FindJava!End_:
!macroend


# Check for Google API keys
# Keys can be obtained as outlined at http://dev.chromium.org/developers/how-tos/api-keys
# They must be specified in this format
# "GoogleAPIKeys=" <API key> "::" <Client ID> "::" <Client secret>
!macro Settings.ExportAPIKeys
	${ReadUserConfig} $R0 "GoogleAPIKeys"
	${IfThen} $R0 == "" ${|} ${ReadUserConfig} $R0 "GoogleAPIKey" ${|}
	${If} $R0 != ""
		${WordFind} $R0 " :: " "+1" $R1
		${WordFind} $R0 " :: " "+2" $R2
		${WordFind} $R0 " :: " "+3" $R3
		System::Call `Kernel32::SetEnvironmentVariable(t"Google_API_Key",               tr11)`
		System::Call `Kernel32::SetEnvironmentVariable(t"Google_Default_Client_ID",     tr12)`
		System::Call `Kernel32::SetEnvironmentVariable(t"Google_Default_Client_Secret", tr13)`
	${EndIf}
!macroend
