# Chromium Portable — PortableApps.com Launcher custom code
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


${SegmentFile}

!include "${PACKAGE}\Other\Source\Utils.nsh"

!addplugindir "${PACKAGE}\Other\Source\NSISPlugins"


#########################
# Launcher localization #
#########################

!include "${PACKAGE}\Other\Source\Standalone\Languages\English.nsh"
!include "${PACKAGE}\Other\Source\Standalone\Languages\PortugueseBR.nsh"


#############
# Variables #
#############

Var _Custom_Parameters

Var _Custom_PortablePasswords_Enabled
Var _Custom_PortablePasswords_MasterPassword


######################################
# PortablePasswords helper functions #
######################################

# Get the PortablePasswords master password
!macro _Custom_GetMasterPassword
	StrCpy $_Custom_PortablePasswords_Enabled 0
	StrCpy $_Custom_PortablePasswords_MasterPassword ""

	${IfThen} ${IsUserOptionTrue} "EnablePortablePasswords" ${|} StrCpy $_Custom_PortablePasswords_Enabled 1 ${|}

	${If} $_Custom_PortablePasswords_Enabled = 1
	${AndIfNot} ${IsUserOptionFalse} "EncryptPortablePasswords"
_Custom_GetMasterPassword!AskPassword_:
		DialogsEx::InputBox 1 $(MasterPasswordInputBoxTitle) $(MasterPasswordInputBoxText) "" ${NSIS_MAX_STRLEN} $(OK) $(Cancel) 10
		${IfThen} $R0 == "" ${|} Goto _Custom_GetMasterPassword!End_ ${|}

		# Hash the passwords and compare the hashes
		StrCpy $_Custom_PortablePasswords_MasterPassword $R0
		ChromePasswords::HashPassword $_Custom_PortablePasswords_MasterPassword
		Pop $R0
		${If} $R0 == "" # Something went wrong
			MessageBox MB_OK|MB_ICONEXCLAMATION $(PortablePasswordsPluginErrorOK)
			StrCpy $_Custom_PortablePasswords_Enabled 0
		${Else}
			${If} ${FileExists} "$DataDirectory\MasterPassword.hash" # Existing install
				FileOpen  $R1 "$DataDirectory\MasterPassword.hash" r
				FileRead  $R1 $R2
				FileClose $R1

				${If} $R0 != $R2 # Oh oh, wrong password; let the user try again
					MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION $(InvalidMasterPassword) IDRETRY _Custom_GetMasterPassword!AskPassword_
					StrCpy $_Custom_PortablePasswords_Enabled 0
				${EndIf}
			${Else} # New install; just store the hash
				FileOpen  $R1 "$DataDirectory\MasterPassword.hash" w
				FileWrite $R1 $R0
				FileClose $R1
			${EndIf}
		${EndIf}
	${EndIf}

_Custom_GetMasterPassword!End_:
!macroend

# Decrypt the passwords
!macro _Custom_DecryptDatabases
	${If} $_Custom_PortablePasswords_Enabled = 1
		FindFirst $R0 $R1 "$DataDirectory\Profiles\*.*"
		${DoWhile} $R1 != ""
			${If} ${FileExists} "$DataDirectory\Profiles\$R1\Portable Passwords"
			${AndIf} ${FileExists} "$DataDirectory\Profiles\$R1\Login Data"
				ChromePasswords::ImportPasswords "$DataDirectory\Profiles\$R1\Portable Passwords" "$DataDirectory\Profiles\$R1\Login Data" $_Custom_PortablePasswords_MasterPassword
			${EndIf}
			FindNext $R0 $R1
		${Loop}
		FindClose $R0
	${EndIf}
!macroend

# Encrypt the passwords
!macro _Custom_EncryptDatabases
	${If} $_Custom_PortablePasswords_Enabled = 1
		FindFirst $R0 $R1 "$DataDirectory\Profiles\*.*"
		${DoWhile} $R1 != ""
			${If} ${FileExists} "$DataDirectory\Profiles\$R1\Login Data"
				ChromePasswords::ExportPasswords "$DataDirectory\Profiles\$R1\Login Data" "$DataDirectory\Profiles\$R1\Portable Passwords" $_Custom_PortablePasswords_MasterPassword
			${EndIf}
			FindNext $R0 $R1
		${Loop}
		FindClose $R0
	${EndIf}
!macroend


###############
# Custom code #
###############

${SegmentPre}
	# Check for incognito
	${If} ${IsUserOptionTrue} "AskForIncognito"
		MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 $(RunInIncognitoMode) IDNO +2
			${AppendCommandLineSwitch} "incognito"
	${EndIf}

	# Check for disk cache in the local disk
	${If} ${IsUserOptionTrue} "LocalDiskCache"
		${AppendCommandLinePath} "disk-cache-dir" "$TMP\Cache"
	${EndIf}

	# Check for Java/jPortable support
	${If} ${FileExists} "$JavaDirectory\Bin\New_Plugin\npJP2.dll"
		${AppendCommandLinePath} "extra-plugin-dir" "$JavaDirectory\Bin\New_Plugin"
	${ElseIf} ${FileExists} "$JavaDirectory\Bin\Plugin2\npJP2.dll"
		${AppendCommandLinePath} "extra-plugin-dir" "$JavaDirectory\Bin\Plugin2"
	${EndIf}

	# Check for PPAPI Flash Player
	${If} ${FileExists} "$DataDirectory\App\PepperFlash\PEPFlashPlayer.dll"
		${ConfigRead} "$DataDirectory\App\PepperFlash\Manifest.json" `    "version": ` $R0
		StrCpy $R0 $R0 -3 1
		${AppendCommandLinePath} "ppapi-flash-path" "$DataDirectory\App\PepperFlash\PEPFlashPlayer.dll"
		${AppendCommandLinePath} "ppapi-flash-version" "$R0"
	${EndIf}

	# Check for language (if set by the Platform at least once)
	ReadEnvStr $R1 "PAL:LanguageCustom"
	${If} $R1 != "NONE"
		${AppendCommandLineOption} "lang" $R1
	${EndIf}

	# Check for API keys (api-key :: client-id :: client-secret)
	${ReadUserConfig} $R0 "GoogleAPIKeys"
	${IfThen} $R0 == "" ${|} ${ReadUserConfig} $R0 "GoogleAPIKey" ${|}
	${If} $R0 != ""
		${WordFind} $R0 " :: " "+1" $R1
		${SetEnvironmentVariable} "Google_API_Key" $R1
		${WordFind} $R0 " :: " "+2" $R1
		${SetEnvironmentVariable} "Google_Default_Client_ID" $R1
		${WordFind} $R0 " :: " "+3" $R1
		${SetEnvironmentVariable} "Google_Default_Client_Secret" $R1
	${EndIf}
!macroend

${SegmentPrePrimary}
	!insertmacro _Custom_GetMasterPassword
	!insertmacro _Custom_DecryptDatabases
!macroend

${SegmentPreExec}
	StrCpy $ExecString "$ExecString$_Custom_Parameters"
!macroend

${SegmentPostPrimary}
	!insertmacro _Custom_EncryptDatabases
!macroend
