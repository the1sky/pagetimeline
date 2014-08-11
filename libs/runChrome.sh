#!/bin/sh
chromeExec=`which google-chrome`
xvfb-run --auto-servernum --server-args='-screen 0, 1024x768x16' $chromeExec --user-data-dir=$6 --window-size=$3,$4 --user-agent=$5 --no-default-browser-check --incognito --enable-multiprocess --enable-benchmarking --enable-net-benchmarking --disable-cache --disable-extensions --remote-debugging-port=$2 -start-maximized > /dev/null 2>&1 &
