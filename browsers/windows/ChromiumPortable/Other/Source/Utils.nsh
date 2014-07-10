# Chromium Portable — Utilities
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


!include LogicLib.nsh
!include WordFunc.nsh


###############
# User config #
###############

# Read an user setting
!ifmacrondef ReadUserConfig
	!macro ReadUserConfig out key
		ClearErrors
		${ConfigRead} "${UserConfigPath}" "${key}=" ${out}
	!macroend
	!define ReadUserConfig "!insertmacro ReadUserConfig"
!endif

# Check if an user option has a specific value; use as `${If} <value> ${IsValueOfUserOption} <opt>`
!macro _IsValueOfUserOption _a _b _t _f
	!insertmacro _LOGICLIB_TEMP
	${ReadUserConfig} $_LOGICLIB_TEMP "${_b}"
	StrCmp $_LOGICLIB_TEMP "${_a}" "${_t}" "${_f}"
!macroend
!define IsValueOfUserOption "IsValueOfUserOption"

# Check if an user option is true
!macro _IsUserOptionTrue _a _b _t _f
	!insertmacro _LOGICLIB_TEMP
	${ReadUserConfig} $_LOGICLIB_TEMP "${_b}"
	StrCmp $_LOGICLIB_TEMP "yes" 0 +6
		StrCpy $_LOGICLIB_TEMP "true"
	StrCmp $_LOGICLIB_TEMP "on"  0 +4
		StrCpy $_LOGICLIB_TEMP "true"
	StrCmp $_LOGICLIB_TEMP "ok"  0 +2
		StrCpy $_LOGICLIB_TEMP "true"
	StrCmp $_LOGICLIB_TEMP "true" "${_t}" "${_f}"
!macroend
!define IsUserOptionTrue `"" IsUserOptionTrue`

# Check if an user option is false
!macro _IsUserOptionFalse _a _b _t _f
	!insertmacro _LOGICLIB_TEMP
	${ReadUserConfig} $_LOGICLIB_TEMP "${_b}"
	StrCmp $_LOGICLIB_TEMP "no"  0 +4
		StrCpy $_LOGICLIB_TEMP "false"
	StrCmp $_LOGICLIB_TEMP "off" 0 +2
		StrCpy $_LOGICLIB_TEMP "false"
	StrCmp $_LOGICLIB_TEMP "false" "${_t}" "${_f}"
!macroend
!define IsUserOptionFalse `"" IsUserOptionFalse`


#######################
# Launch command line #
#######################

!ifdef PACKAGE
	!define ExecString $_Custom_Parameters
!else
	!define ExecString $1
!endif

# Quote a string if it contains whitespace
!macro Quote out str
	${WordFind} "${str}" " " "*" ${out}
	${If} ${out} != "${str}"
		StrCpy ${out} `"${str}"`
	${EndIf}
!macroend
!define Quote "!insertmacro Quote"

# Append an arbitrary value to the launch command-line
!macro AppendCommandLineValues str
	${If} "${str}" != ""
		StrCpy ${ExecString} "${ExecString} ${str}"
	${EndIf}
!macroend
!define AppendCommandLineValues "!insertmacro AppendCommandLineValues"

# Append a switch to the launch command-line
!macro AppendCommandLineSwitch name
	${AppendCommandLineValues} "--${name}"
!macroend
!define AppendCommandLineSwitch "!insertmacro AppendCommandLineSwitch"

# Append an option to the launch command-line
!macro AppendCommandLineOption name value
	${Quote} $R9 "${value}"
	# Now append the switch to the command line
	${AppendCommandLineValues} "--${name}=$R9"
!macroend
!define AppendCommandLineOption "!insertmacro AppendCommandLineOption"

# Append an switch with a path as value to the launch command-line
!macro AppendCommandLinePath name path
	GetFullPathName /SHORT $R9 "${path}"
	${If} $R9 == "" # No short name?
		StrCpy $R9 "${path}"
	${EndIf}
	${AppendCommandLineOption} "${name}" $R9
!macroend
!define AppendCommandLinePath "!insertmacro AppendCommandLinePath"


###########
# Logging #
###########

!ifdef Debug
	Var _LogFile

	!macro LogInit message
		FileOpen $_LogFile "$EXEDIR\Debug.log" a
		FileSeek $_LogFile 0 END
		FileWriteUTF16LE $_LogFile "{{{$\r$\n${message}$\r$\n"
	!macroend
	!define LogInit "!insertmacro LogInit"

	!macro Log message
		FileWriteUTF16LE $_LogFile "${__FILE__}:${__LINE__}: ${message}$\r$\n"
	!macroend
	!define Log "!insertmacro Log"

	!macro LogEnd
		FileWriteUTF16LE $_LogFile "}}}$\r$\n$\r$\n"
		FileClose $_LogFile
	!macroend
	!define LogEnd "!insertmacro LogEnd"
!else
	!define LogInit ";"
	!define Log ";"
	!define LogEnd ";"
!endif
