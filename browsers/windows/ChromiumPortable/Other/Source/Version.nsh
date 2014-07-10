# Chromium Portable — Version info
# Copyright © 2010-2013 Aluísio Augusto Silva Gonçalves
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0.  If a copy of the MPL was not distributed with this file, You can
# obtain one at http://mozilla.org/MPL/2.0/.


# Packed launcher version
!define LauncherVersion  "13.1"
!define LauncherVersionF "13.1.0.0"

# Bundle version
!searchparse /file "..\..\..\App\AppInfo\AppInfo.ini" "DisplayVersion=" PackageVersion
!searchparse /file "..\..\..\App\AppInfo\AppInfo.ini" "PackageVersion=" PackageVersionWin

# Common version information
!ifdef AddCommonVersionInfo
!undef AddCommonVersionInfo
VIProductVersion                  "${PackageVersionWin}"
VIAddVersionKey  ProductName      "${PortableAppName}"
VIAddVersionKey  FileVersion      "${LauncherVersion}"
VIAddVersionKey  ProductVersion   "${PackageVersion}"
VIAddVersionKey  CompanyName      "Aluísio Augusto Silva Gonçalves"
VIAddVersionKey  LegalCopyright   "© 2010-2013 Aluísio Augusto Silva Gonçalves"
!endif
