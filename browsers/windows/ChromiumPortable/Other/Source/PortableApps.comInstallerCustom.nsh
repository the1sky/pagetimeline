# Chromium Portable — PortableApps.com Installer custom code
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


!macro CustomCodePostInstall
	${If} ${FileExists} "$INSTDIR\Data\Profile"
		Rename "$INSTDIR\Data\Profile" "$INSTDIR\Data\Profiles"
	${EndIf}
!macroend
