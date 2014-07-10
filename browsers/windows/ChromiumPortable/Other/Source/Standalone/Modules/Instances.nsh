# Chromium Portable — Instance management module
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


# Check if another instance using this same user data package is already running
!macro Instances.CheckPayloadMutex
	${WordReplace} $2 "\" ":" "+" $R0 # Replace \ with : in the package path
	${Log} "Checking the user data package mutex (${PortableAppID}!$R0)…"
	System::Call `Kernel32::CreateMutex(i0, i0, t"${PortableAppID}!$R0") ?e`
	Pop $R0
	${Log} "Mutex check result: $R0"
	${If} $R0 <> 0
		MessageBox MB_OK|MB_ICONSTOP $(UserDataPackageInUse)
		${LogEnd}
		Abort
	${EndIf}
!macroend


# Check if a previous launch using this user data package has crashed
# Puts 'true' or 'false' on the stack
!macro Instances.CheckCrash
	Push "false"
	FileOpen $R0 "${InstanceListPath}" a
	FileClose $R0

	ClearErrors
	${ConfigRead} "${InstanceListPath}" "$2=" $R0
	${IfNot} ${Errors}
	${AndIf} ${FileExists} "$R0\*.*"
		${Log} "Found crashed launch at $R0"
		!insertmacro Splash.Stop
		GetFileTime "${Payload.UserData}" $R1 $R2
		MessageBox MB_YESNOCANCEL $(UseOldData) IDYES _Instances.CheckCrash!UsePrevious_ IDCANCEL _Instances.CheckCrash!Abort_
			${Log} "Proceeding with the current user data"
			Goto _Instances.CheckCrash!End_
		_Instances.CheckCrash!Abort_:
			Call AbortLauncher
		_Instances.CheckCrash!UsePrevious_:
			${Log} "Proceeding with the recovered data; moving current user data package to ${Payload.UserData}-$R1$R2"
			Rename "${Payload.UserData}" "${Payload.UserData}-$R1$R2"
			Rename "$R0\Data" "${DataDir}"
			Pop $R3
			Push "true"
		_Instances.CheckCrash!End_:
			RMDir /R $R0
	${EndIf}
!macroend
