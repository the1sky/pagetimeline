#!/bin/sh
cat /etc/issue | grep CentOS
if [ $? -eq 0 ]; then
    wget http://chrome.richardlloyd.org.uk/install_chrome.sh
    chmod +x install_chrome.sh
    sh install_chrome.sh
else
    cat /etc/issue | grep Ubuntu
    if [ $? -eq 0 ]; then
        base_url='http://115.28.244.165//browser/ubuntu/'
        prefix='google-chrome-stable_current'
        suffix='.deb'
        cd /tmp
        arch=`uname -m`
        if [ $arch == 'x86_64' ]; then
            arch='_amd64'
        else
            arch='_i386'
        fi
        chrome_url=${base_url}${prefix}${arch}${suffix}
        wget $chrome_url
        chmod u+x ${prefix}${arch}${suffix}
        sudo dpkg -i google-chrome*
        sudo apt-get -f install -y
    fi
fi