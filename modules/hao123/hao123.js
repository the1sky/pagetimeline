/**
 * Created by nant on 9/11/2014.
 */
exports.version = '0.1';

exports.module = function (pagetimeline, callback) {
    callback(false, {message: 'add dynamic crawl page module done!'});

    pagetimeline.log('ha123 ...');

    var path = require('path');
    var fs = require('fs');
    var _ = require('underscore');

    var browser = pagetimeline.model.browser;
    var timeout = pagetimeline.getParam('timeout');
    var url = pagetimeline.model.originalUrl;
    var runstep = pagetimeline.model.runstep;
    var uid = pagetimeline.model.uid;

    var urlTemplate = require('url-template');
    url = urlTemplate.parse(url).expand({
        page: runstep
    });
    pagetimeline.model.url = url;

    browser.onLoadEventFired(function (res) {
        setTimeout(function () {
            var script = getUrl.toString() + ';getUrl()';
            var harName = path.resolve('./', 'hao123');
            browser.evaluate(script, function (err, res) {
                if (!err && res && res.result) {
                    var urls = res.result.value;
                    _.forEach(urls, function (url, index) {
                        fs.appendFileSync(harName, url + '\n\r');
                    });
                }
                pagetimeline.finishModule();
            });
        }, timeout);
    });

    function getUrl() {
        var hrefs = []
	    $('#yrdy' ).
        $('.content-con a').each(function (index) {
            hrefs.push($(this).attr('href'));
        });
        return hrefs;
    }
}