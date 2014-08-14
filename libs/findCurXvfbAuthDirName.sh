#!/bin/sh

getXvfbAuthDir()
{
	xvfbDir=$(ls -t /tmp | grep 'xvfb-run\..*');
	for dir in $xvfbDir
	do
		    echo "$dir";
		    return 0;
	done
	return 1;
}

xvfbAuthDir=$(getXvfbAuthDir);
echo $xvfbAuthDir;

