#!/bin/sh
chromeExec=`which google-chrome`
nohup xvfb-run --auto-servernum --server-args='-screen 0, 1024x768x16' $chromeExec --incognito --enable-benchmarking --enable-net-benchmarking --disable-cache --disable-extensions --remote-debugging-port=9222 -start-maximized > /dev/null &
echo $!
