###操作系统/浏览器支持

windows:chrome

ubuntu(desktop+server):chrome

android:chrome

###安装

####windows

    npm install pagetimeline
    
####ubuntu

ubuntu通过apt-get安装node后默认运行名为nodejs，需要更名为node，假定nodejs路径为: /usr/bin/nodejs

    sudo ln -s /usr/bin/nodejs /usr/bin/node
    sudo visudo
    在secure_path值前面添加/usr/bin

安装pagetimeline:

    sudo npm install pagetimeline --unsafe-perm

注意事项:

    大陆可能需要翻墙

#####centos

切换到root权限:

    su root

安装pagetimeline:
    
    npm install pagetimeline --unsafe-perm

###使用示例

标准：

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --verbose
    
输出格式为json：

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --verbose --format=json
    
输出har文件：

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --verbose --har-dir=./har/
    
输出性能分析结果文件:

    node ./bin/pagetimeline.js --url=http://www.baidu.com --timeout=2000 --verbpse --result-dir=./result/
    
使用android chrome测试：

    usb连接手机
    
    node ./bin/pagetimeline.js --url=http://www.baidu.com --verbose --mobile=android
    
带缓存测试：

测试两遍，no cache vs cache

    node ./bin/pagetimeline.js --url=http://www.baidu.com --verbose --reload

CLI支持:
    
    node ./bin/pagetimeline.js --url=http://www.baidu.com --silent
    
    此时仅输出结果数据到stdout或者stderr

###命令行参数支持

* --url, target url, e.g. --url=http://www.baidu.com
* --server, remote debugger server, e.g. --server=localhost | xxx
* --port, remote debugger port, default 9222, if not setting,auto find available port, e.g. --port=9222
* --disk-cache, disk cache,default false, e.g. --disk-cache=true
* --mobile, mobile android or iphone, e.g. --mobile=android
* --config, JSON-formatted config file, e.g. --config=./config.log
* --viewport, window viewport width and height, e.g. --viewport=1920x768 
* --proxy, specifies the proxy server to use, e.g. --proxy=192.168.1.42:8080
* --modules, specify module, e.g. --modules=firstscreen,whitescreen
* --skip-modules, skip selected modules [moduleOne],[moduleTwo],.., e.g. --skip-modules=firstscreen,whitescreen.
* --timeout, time after onload event, default 2000, e.g. --timeout=2000
* --browser-timeout,time after open browser command, default 2000, e.g. --browser-timeout=2000
* --user-agent, provide a custom user agent, e.g. --user-agent=Mozilla/5.0 (Windows NT 6.3; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0
* --verbose, write debug messages to console, e.g. --verbose
* --silent, dont\'t write anything to the console, e.g. --slient
* --format, output format, plain | json | csv, default plain, e.g. --format=json
* --browser, chrome,firefox, default chrome, e.g. --browser=chrome
* --har-dir, file directory, e.g. --har-dir=./
* --result-dir, performance analyze result file directory, e.g. --result-dir=./
* --reload, performance analyze twice, first with no-cahce and second with cache, e.g. --reload
* --reload-count,reload count, 2 or bigger, e.g. --reload-count=2


###支持的功能

* first_screen_time, 首屏时间，及首屏内图片元素

* white_screen_time,白屏时间

* assetsTypes, 按资源类型划分，各类型包括：数量，大小，url详情

    html_requests
    
    html_size
    
    jpeg_requests
    
    jpeg_size
    
    png_requests
    
    png_size
    
    css_requests
    
    css_size
    
    js_requests
    
    js_size
    
    gif_requests
    
    gif_size
    
    slowest_requests
    
    ...

* domreadyEvent

* onloadEvent

* load_time, 总下载时间

* timing

    timing_appcache
    
    timing_dns
    
    timing_tcp
    
    timing_ttfb
    
* global_variables 全局变量

* domains 域名总数及详情

* max_requests_per_domain 包含最大请求数的域

* webspeed, 植入webspeed监控脚本的性能数据，详情见http://webspeed.baidu.com

* 更多见: pagetimeline/modules

### 参考：
    http://remotedebug.org/integrations/

    https://github.com/macbre/phantomas

### think

* 网速模拟
* 并行

    ubuntu下，chrome在切换user data directory时会弹出默认浏览器设置，暂时无法去除，导致时间相关性能指标为空
    
    windows下，暂时不处理


