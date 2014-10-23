#!/bin/sh
chromeExec=`which google-chrome`
nohup xvfb-run --auto-servernum --server-args="-screen 0, $3x$4x16" $chromeExec --window-size=$3,$4 --user-agent=$5 --no-default-browser-check --incognito --enable-multiprocess --enable-benchmarking --enable-net-benchmarking --disable-cache --disable-extensions --remote-debugging-port=$2 > /dev/null 2>&1 &
