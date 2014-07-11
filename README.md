基于远程过程调试协议的性能分析

###操作系统支持
window,linux,mac

###浏览器支持
firefox,chrome,safari

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

    暂时需要手动安装xvfb,chrome,见:./libs/installChrome.sh

    需要对当前目录所有文件添加运行权限，chmod -R u+x *

    nodejs ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=5000 --verbose



安装独立可运行的浏览器

打开浏览器
    windows,linux桌面版,
    服务版？

判断可以连接remote debugging protocol服务端了
怎么判断？

进行分析

    白屏
    首屏
    
    
参考：
    weinre
    webdriver

    http://remotedebug.org/integrations/

//todo，更多参数
//todo，chrome的silent模式无法获取数据
//todo，linux支持,x11
//确认可支持的浏览器版本
//移动版浏览器
//更多浏览器
//网速模拟
//更多参数
//todo,har文件


