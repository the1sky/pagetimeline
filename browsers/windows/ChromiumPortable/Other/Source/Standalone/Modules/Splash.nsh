# Chromium Portable — Splash image module
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


!macro Splash.Show event
	${IfNot} ${IsUserOptionTrue} "DisableSplashScreen"
		File "/oname=$PLUGINSDIR\${event}.jpg" "Splashes\${event}.jpg"
		NewAdvSplash::Show /NOUNLOAD 600000 1000 500 -1 /BANNER "$PLUGINSDIR\${event}.jpg"
	${EndIf}
!macroend

!macro Splash.Stop
	NewAdvSplash::Stop /NOUNLOAD /FADEOUT
	; NewAdvSplash::Wait /NOUNLOAD
	Sleep 500
!macroend

!macro Splash.Unload
	NewAdvSplash::Stop
!macroend
