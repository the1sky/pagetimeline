@echo off
setlocal EnableDelayedExpansion
:Menu
echo 32-bit
set "Count=1"
for /f "tokens=2,*" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Clients\StartMenuInternet" /ve 2^>nul') do set "Default=%%B"
for /f "skip=3 delims=" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Clients\StartMenuInternet" 2^>nul') do (
    if "%%~nxA"=="%Default%" (
        echo !Count!. %%~nA [Default]
    ) else (
        echo !Count!. %%~nA
    )
    set /a "Count+=1"
)
echo.
echo 64-bit if 32-bit above, else 32-bit
for /f "tokens=2,*" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Clients\StartMenuInternet" /ve 2^>nul') do set "Default=%%B"
for /f "skip=3 delims=" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Clients\StartMenuInternet" 2^>nul') do (
    if "%%~nxA"=="%Default%" (
        echo !Count!. %%~nA [Default]
    ) else (
        echo !Count!. %%~nA
    )
    set /a "Count+=1"
)
echo.
:Input
set "Input="
set /p "Input=> Select a Browser: "
if not defined Input goto Input
set "Input=%Input:"=%"
set "Count=1"
:: NOTE if the browser name is typed out and matching on the name then the last match will be chosen.
:: As it is currently setup this means that the 32-bit version will always win on a name match.
for /f "skip=3 delims=" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Clients\StartMenuInternet" 2^>nul') do (
    if /i "%Input%"=="%%~nA" set "Choice=%%~A"
    if "%Input%"=="!Count!" set "Choice=%%~A"
    set /a "Count+=1"
)
for /f "skip=3 delims=" %%A in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Clients\StartMenuInternet" 2^>nul') do (
    if /i "%Input%"=="%%~nA" set "Choice=%%~A"
    if "%Input%"=="!Count!" set "Choice=%%~A"
    set /a "Count+=1"
)
if not defined Choice goto Menu
for /f "tokens=2,*" %%A in ('reg query "%Choice%\shell\open\command" /ve 2^>nul') do set "Command=%%~B"
start "Browser" "%Command%"
endlocal
echo Done
pause>nul