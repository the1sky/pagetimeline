# Chromium Portable — PortablePasswords module
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


!addplugindir ..\NSISPlugins


# Get the PortablePasswords master password
!macro Passwords.GetMasterPassword
	StrCpy $3 0
	StrCpy $4 ""

	${IfThen} ${IsUserOptionTrue} "EnablePortablePasswords" ${|} StrCpy $3 1 ${|}

	${If} $3 = 1
	${AndIfNot} ${IsUserOptionFalse} "EncryptPortablePasswords"
		${Log} "Encrypted portable passwords enabled"
_PortablePasswords.GetMasterPassword!AskPassword_:
		${Log} "Asking for PortablePassword's password"
		DialogsEx::InputBox 1 $(MasterPasswordInputBoxTitle) $(MasterPasswordInputBoxText) "" ${NSIS_MAX_STRLEN} $(OK) $(Cancel) 3
		${IfThen} $4 == "" ${|} Call AbortLauncher ${|}

		# Hash the passwords and compare the hashes
		ChromePasswords::HashPassword $4
		Pop $R0
		${If} $R0 == "" # Something went wrong
			${Log} "Failed to load the PortablePasswords plugin"
			MessageBox MB_YESNO|MB_ICONEXCLAMATION $(PortablePasswordsPluginError) IDYES +2
				Call AbortLauncher
			StrCpy $3 0
		${Else}
			${If} ${FileExists} "${DataDir}\MasterPassword.hash" # Existing install
				${Log} "Found password hash file"
				FileOpen  $R1 "${DataDir}\MasterPassword.hash" r
				FileRead  $R1 $R2
				FileClose $R1

				${If} $R0 != $R2 # Oh oh, wrong password; let the user try again
					${Log} "Invalid password (hash: $R0)"
					MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION $(InvalidMasterPassword) IDRETRY _PortablePasswords.GetMasterPassword!AskPassword_
					Call AbortLauncher
				${EndIf}
			${Else} # New install; just store the hash
				${Log} "Password hash file not found; assuming new install"
				FileOpen  $R1 "${DataDir}\MasterPassword.hash" w
				FileWrite $R1 $R0
				FileClose $R1
			${EndIf}
		${EndIf}
	${EndIf}
!macroend


# Decrypt the passwords
!macro Passwords.Decrypt
	${If} $3 = 1
		FindFirst $R0 $R1 "${DataDir}\Profiles\*.*"
		${DoWhile} $R1 != ""
			${If} ${FileExists} "${DataDir}\Profiles\$R1\Portable Passwords"
			${AndIf} ${FileExists} "${DataDir}\Profiles\$R1\Login Data"
				${Log} `Decrypting passwords in "${DataDir}\Profiles\$R1\Portable Passwords" to "${DataDir}\Profiles\$R1\Login Data"`
				ChromePasswords::ImportPasswords "${DataDir}\Profiles\$R1\Portable Passwords" "${DataDir}\Profiles\$R1\Login Data" $4
			${EndIf}
			FindNext $R0 $R1
		${Loop}
		FindClose $R0
	${EndIf}
!macroend


# Encrypt the passwords
!macro Passwords.Encrypt
	${If} $3 = 1
		FindFirst $R0 $R1 "${DataDir}\Profiles\*.*"
		${DoWhile} $R1 != ""
			${If} ${FileExists} "${DataDir}\Profiles\$R1\Login Data"
				${Log} `Encrypting passwords in "${DataDir}\Profiles\$R1\Login Data" to "${DataDir}\Profiles\$R1\Portable Passwords"`
				ChromePasswords::ExportPasswords "${DataDir}\Profiles\$R1\Login Data" "${DataDir}\Profiles\$R1\Portable Passwords" $4
			${EndIf}
			FindNext $R0 $R1
		${Loop}
		FindClose $R0
	${EndIf}
!macroend
