/**
 * Created by nant on 2014/7/13.
 */

exports.version = '0.1';
exports.name = 'assetsTypes';

exports.run = function(pagetimeline,callback){
	pagetimeline.log( 'asserts types ...');
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');
	var requestId_info = {};

	browser.Network.responseReceived(function(res){
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;
		if( !requestId_info[requestId] ){
			requestId_info[requestId] = {}
		}
		requestId_info[requestId] = {
			'url':url,
			'timestamp':timestamp,
			'responseBody':response
		};
	});

	browser.Page.loadEventFired(function(res){
		setTimeout(function(){
			var start = +new Date();
			var mime  = require('mime');
			var assertsInfo = {}
			var _ = require('underscore');
			mime.define({
				'text/javascript': ['js'],
				'application/x-javascript':['js'],
				'text/json':['json'],
				'text/xml':['xml']
			});

			_.each(requestId_info,function(value,key){
				var url = value.url;
				var responseBody = value.responseBody;
				if( !responseBody ) return;
				var mimeExt = mime.extension( responseBody.mimeType );
				/*
				 if( !mimeExt ){
				 console.log( mimeExt );
				 }
				 if( mimeExt == 'js' ){
				 console.log(mimeExt );
				 }
				 */
				var contentLen = 0;
				if( responseBody.headers['Content-Length'] ){
					contentLen = parseFloat( responseBody.headers['Content-Length'] );
				}else{
					contentLen = 0;
					/*
					 var browser = pagetimeline.core.browser;
					 browser.send('Network.getResponseBody',{requestId:key},function(err,data){
					 "use strict";
					 console.log(data);
					 })
					 */
				}
				if( !assertsInfo[mimeExt] ){
					assertsInfo[mimeExt] = {
						count:0,
						size:0,
						urls:[]
					}
				}

				assertsInfo[mimeExt].count ++;
				assertsInfo[mimeExt].size += contentLen;
				assertsInfo[mimeExt].urls.push( url );
			});

			_.each(assertsInfo,function(value,key){
				pagetimeline.setMetric(key, '   count:' + value.count + '  size:' + ( value.size / 1024 ).toFixed(2) + 'KB'  );
				_.each( value.urls,function(url){
					pagetimeline.addOffender(key, url );
				})
			})

			pagetimeline.log( 'asserts types done in ' + (+new Date() - start ) + 'ms' );
		},timeout);
	});

	callback(false,{message:'add assets types done!'});
}
