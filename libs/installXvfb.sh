#!/bin/sh
cat /etc/issue | grep CentOS
if [ $? -eq 0 ]; then
    yum -y install xorg-x11-server-Xvfb
fi

cat /etc/issue | grep Ubuntu
if [ $? -eq 0 ]; then
    sudo apt-get -y update
    sudo apt-get -y install -y xvfb fluxbox x11vnc dbus libasound2 libqt4-dbus libqt4-network libqtcore4 libqtgui4 libxss1 libpython2.7 libqt4-xml libaudio2 libmng1 fontconfig liblcms1 lib32stdc++6 lib32asound2 ia32-libs libc6-i386 lib32gcc1 nano
    sudo apt-get -y install -y python-gobject-2
    sudo apt-get -y install -y curl git
fi

