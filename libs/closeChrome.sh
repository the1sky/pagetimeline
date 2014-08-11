#!/bin/sh

#chromePort=$1;
#xvfbDirName=$2;

getXvfbAuthDir()
{
	xvfbDir=$(ls -t /tmp | grep 'xvfb-run\..*');
	for dir in $xvfbDir
	do
	    echo $1;
	    if [ $dir = $1 ]; then
		    echo "$dir";
		    return 0;
	    fi
	done
	return 1;
}

getXvfbPid()
{
	echo $(ps aux | pgrep -f $1);
	return 0;
}

killProc()
{
    echo $1;
	if [ $1 -gt 0 ];then
		kill -9 $1;
	fi
}

xvfbKey="xvfb.*--remote-debugging-port=$1";
xvfbPid=$(getXvfbPid $xvfbKey);
killProc $xvfbPid;
xvfbAuthDir=$(getXvfbAuthDir $2);
xvfbAuthPid=$(getXvfbPid $xvfbAuthDir);
killProc $xvfbAuthPid;

