###PageTimeline, 基于远程过程调试协议的性能分析工具

###操作系统/浏览器支持
now:

window:chrome

linux(desktop+server):chrome

soon:

android:chrome

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

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=5000 --verbose

####linux

    暂时需要手动安装xvfb,chrome,运行./libs/installChrome.sh

    需要对pagetimeline目录所有文件添加运行权限，chmod -R u+x *

    nodejs ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=5000 --verbose


###命令行参数支持

###支持的功能

### 参考：
    http://remotedebug.org/integrations/

### think

    网速模拟
    更多参数
    har文件


