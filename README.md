###PageTimeline, 基于远程过程调试协议的性能分析工具

###操作系统/浏览器支持
now:

window:chrome

linux(desktop+server):chrome

android:chrome

soon:


window:firefox

linux(desktop+server):firefox

mac:chrome,safari


###安装

暂时不支持安装

####windows

    npm install pagetimeline

####linux

    sudo npm install pagetimeline

###使用实例

####windows

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --format=json

####linux

    暂时需要手动安装xvfb,chrome,运行sudo ./libs/installChrome.sh

    nodejs ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --format=json


###命令行参数支持

* --server, remote debugger server, e.g. --server=localhost | xxx
* --port, remote debugger port, default 9222, if not setting,auto find available port, e.g. --port=9222
* --config, JSON-formatted config file, e.g. --config=./config.log
* --viewport, window viewport width and height, e.g. --viewport=1920x768 
* --proxy, specifies the proxy server to use, e.g. --proxy=192.168.1.42:8080
* --modules, specify module, e.g. --modules=firstscreen,whitescreen
* --skip-modules, skip selected modules [moduleOne],[moduleTwo],.., e.g. --skip-modules=firstscreen,whitescreen.
* --timeout, time after onload event, default 2000, e.g. --timeout=2000
* --user-agent, provide a custom user agent, e.g. --user-agent=Mozilla/5.0 (Windows NT 6.3; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0
* --verbose, write debug messages to console, e.g. --verbose
* --silent, dont\'t write anything to the console, e.g. --slient
* --format, output format, plain | json | csv, default plain, e.g. --format=json
* --browser, chrome,firefox, default chrome, e.g. --browser=chrome

###支持的功能

* firstScreenTime, 首屏时间，及首屏内图片元素

* whiteScreenTime,白屏时间

* assetsTypes, 按资源类型划分，各类型包括：数量，大小，url详情

* domreadyEvent

* onloadEvent

* loadTime, 总下载时间

* timing

* webspeed, 植入webspeed监控脚本的性能数据,http://webspeed.baidu.com

### 参考：
    http://remotedebug.org/integrations/

### think

    网速模拟
    更多参数
    har文件


