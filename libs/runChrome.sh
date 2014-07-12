#!/bin/sh
chromeExec=`which google-chrome`
xvfb-run --server-args='-screen 0, 1024x768x16' $chromeExec --window-size=$3,$4 --user-agent=$5 --incognito --enable-benchmarking --enable-net-benchmarking --disable-cache --disable-extensions --remote-debugging-port=$2 -start-maximized > /dev/null &
exit
