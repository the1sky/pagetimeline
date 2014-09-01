#!/bin/sh
cat /etc/issue | grep CentOS
if [ $? -eq 0 ]; then
    wget http://chrome.richardlloyd.org.uk/install_chrome.sh
    chmod +x install_chrome.sh
    sh install_chrome.sh
fi


cat /etc/issue | grep Ubuntu
if [ $? -eq 0 ]; then
    sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
    sudo apt-get update -y
    sudo apt-get install -y google-chrome-stable
fi