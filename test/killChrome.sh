#!/bin/sh

NAME="chrome"
for pid in $(pgrep "$NAME"); 
do 
   kill -9 $pid
done
