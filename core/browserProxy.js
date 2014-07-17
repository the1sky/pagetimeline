/**
 * remote debugging protocol对象封装代理
 *
 * page,timeline,runtime,network
 *
 * Created by nant on 2014/7/16.
 */

var browserProxy = function(host, port, browserType){
	this.connected = false;
	this.browser = null;
	this.host = host;
	this.port = port;
	this.browserType = browserType;
	this.injects = [];
}

/**
 *
 * @param callback
 */
browserProxy.prototype = {
	init:function(callback){
		this.browserType;
		var Chrome = require( 'chrome-remote-interface' );
		var self = this;
		Chrome( {host:this.host, port:this.port}, function(browser){
			self.browser = browser;
			self.connected = browser ? true : false;
			callback( browser );
		} );
	},
	/**
	 *
	 * @param callback
	 */
	enablePage:function(callback){
		this.browser && this.browser.send( 'Page.enable', {}, function(err, response){
			callback( err, response );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	disablePage:function(callback){
		this.browser && this.browser.send( 'Page.disable', {}, function(err, response){
			callback( err, response );
		} );
	},

	/**
	 *
	 * @param ignoreCache
	 * @param scriptToEvaluateOnload
	 * @param callback
	 */
	reloadPage:function(ignoreCache, scriptToEvaluateOnload, callback){
		this.browser && this.browser.send( 'Page.reload', {ignoreCache:ignoreCache, scriptToEvaluateOnLoad:scriptToEvaluateOnload}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param url
	 * @param callback
	 */
	navigate:function(url, callback){
		var self = this;

		var openPage = function(url,callback){
			//open page
			self.browser && self.browser.send( 'Page.navigate', {url:url}, function(err, data){
				callback( err, data );
			} )
		}

		//inject first
		var count = 0;
		var len = this.injects.length;
		if( len > 0 ){
			this.injects.forEach( function(data){
				var script = data['script'];
				this.evaluate( script, "", 0, true, function(err, res){
					if( ++count == len ){
						openPage.call(self,url,callback);
					}
				} );
			},this );
		}else{
			openPage.call(this,url,callback);
		}
	},

	/**
	 *
	 * @param latiude
	 * @param longitude
	 * @param accuracy
	 * @param callback
	 */
	setGeolocationOverride:function(latiude, longitude, accuracy, callback){
		this.browser && this.browser.sned( 'Page.setGeolocationOverride', {latiude:latiude, longitude:longitude, accuracy:accuracy}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param frameId
	 * @param callback
	 */
	onFrameAttached:function(callback){
		var self = this;
		if( !this.frameAttachedCallbacks ){
			this.frameAttachedCallbacks = [];
			this.browser && this.browser.on( 'Page.frameAttached', function(res){
				self.frameAttachedCallbacks.forEach( function(callback){
					callback( res );
				} );
			} );
		}
		this.frameAttachedCallbacks.push( callback );
	},

	/**
	 *
	 * @param frameId
	 * @param callback
	 */
	onFrameDetached:function(callback){
		var self = this;
		if( !this.frameDetachedCallbacks ) this.frameDetachedCallbacks = [];
		this.frameDetachedCallbacks.push( callback );
		this.browser && this.browser.on( 'Page.frameDetached', function(res){
			self.frameDetachedCallbacks.forEach( function(callback){
				callback( res );
			} );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onDomContentEventFired:function(callback){
		var self = this;
		if( !this.domreadyCallbacks ) {
			this.domreadyCallbacks = [];
			this.browser && this.browser.on( 'Page.domContentEventFired', function(res){
				self.domreadyCallbacks.forEach( function(callback){
					callback( res );
				} );
			} );
		}
		this.domreadyCallbacks.push( callback );
	},

	/**
	 *
	 * @param callback
	 */
	onLoadEventFired:function(callback){
		var self = this;
		if( !this.onloadCallbacks ) {
			this.onloadCallbacks = [];
			this.browser && this.browser.on( 'Page.loadEventFired', function(res){
				self.onloadCallbacks.forEach( function(callback){
					callback( res );
				} );
			} )
		}
		this.onloadCallbacks.push( callback );
	},

	/**
	 *
	 * @param callback
	 */
	enableRuntime:function(callback){
		this.browser && this.browser.send( 'Runtime.enable', {}, function(err, data){
			callback( err, data );
		} );
	},

	/**
	 *
	 * @param expression
	 * @param objectGroup
	 * @param contextId
	 * @param returnByValue
	 * @param callback
	 */
	evaluate:function(expression, objectGroup, contextId, returnByValue, callback){
		this.browser && this.browser.send( 'Runtime.evaluate', {expression:expression, objectGroup:objectGroup, contextId:contextId, returnByValue:returnByValue}, function(err, data){
			callback( err, data );
		} );
	},

	/**
	 *
	 * @param objectId
	 * @param ownProperties
	 * @param callback
	 */
	getProperties:function(objectId, ownProperties, callback){
		"use strict";
		this.browser && this.browser.send( 'Runtime.getProperties', {objectId:objectId, ownProperties:ownProperties}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param objectId
	 * @param callback
	 */
	releaseObject:function(objectId, callback){
		this.browser && this.browser.send( 'Runtime.releaseObject', {objectId:objectId}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param objectGroup
	 * @param callback
	 */
	releaseObjectGroup:function(objectGroup, callback){
		this.browser && this.browser.send( 'Runtime.releaseObjectGroup', {objectGroup:objectId}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onExecutionContextCreated:function(callback){
		if( !this.onExecutionContextCreatedCallbacks ) this.onExecutionContextCreatedCallbacks = [];
		this.onExecutionContextCreatedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Runtime.executionContextCreated', {}, function(res){
			callback( res );
			self.onExecutionContextCreatedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param maxCallStackDepth
	 * @param callback
	 */
	startTimeline:function(maxCallStackDepth, callback){
		this.browser && this.browser.send( 'Timeline.start', {maxCallStackDepth:maxCallStackDepth}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	stopTimeline:function(callback){
		this.browser && this.browser.send( 'Timeline.stop', {}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onTimelineRecorded:function(callback){
		if( !this.onTimelineRecordedCallbacks ) this.onTimelineRecordedCallbacks = [];
		this.onTimelineRecordedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Timeline.eventRecored', {}, function(res){
			self.onTimelineRecordedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callback
	 */
	enableNetwork:function(callback){
		this.browser && this.browser.send( 'Network.enable', {}, function(err, data){
			callback(err,data);
		} )
	},

	/**
	 *
	 * @param callback
	 */
	disableNetwork:function(callback){
		this.browser && this.browser.send( 'Network.disable', {}, function(err, data){
			callback();
		} )
	},

	/**
	 *
	 * @param requestId
	 * @param callback
	 */
	getResponseBody:function(requestId, callback){
		this.browser && this.browser.send( 'Network.getResponseBody', {requestId:requestId}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param cacheDisabled
	 * @param callback
	 */
	setCacheDisabled:function(cacheDisabled, callback){
		this.browser && this.browser.send( 'Network.setCacheDisabled', {cacheDisabled:cacheDisabled}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param headers
	 * @param callback
	 */
	setExtraHTTPHeaders:function(headers, callback){
		this.browser && this.browser.send( 'Network.setExtraHTTPHeaders', {headers:headers}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param userAgent
	 * @param callback
	 */
	setUserAgentOverride:function(userAgent, callback){
		this.browser && this.browser.send( 'Network.setUserAgentOverride', {userAgent:userAgent}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	canClearBrowserCache:function(id, callback){
		this.browser && this.browser.send( 'Network.canClearBrowserCache', {id:id}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	clearBrowserCache:function(id, callback){
		this.browser && this.browser.send( 'Network.clearBrowserCache', {id:id}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	canClearBrowserCookies:function(id, callback){
		this.browser && this.browser.send( 'Network.canClearBrowserCookies', {id:id}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	clearBrowserCookies:function(id, callback){
		this.browser && this.browser.send( 'Network.clearBrowserCookies', {id:id}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onDataReceived:function(callback){
		if( !this.onDataReceivedCallbacks ) this.onDataReceivedCallbacks = [];
		this.onDataReceivedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.dataReceived', {}, function(res){
			self.onDataReceivedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onLoadingFailed:function(callbck){
		if( !this.onLoadingFailedCallbacks ) this.onLoadingFailedCallbacks = [];
		this.onLoadingFailedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.loadingFailed', {}, function(res){
			self.onLoadingFailedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onLoadingFinished:function(callbck){
		if( !this.onLoadingFinishedCallbacks ) this.onLoadingFinishedCallbacks = [];
		this.onLoadingFinishedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.loadingFinished', {}, function(res){
			self.onLoadingFinishedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onRequestServedFromCache:function(callbck){
		if( !this.onRequestServedFromCacheCallbacks ) this.onRequestServedFromCacheCallbacks = [];
		this.onRequestServedFromCacheCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.requestServerFromCache', {}, function(res){
			self.onRequestServedFromCacheCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onRequestWillBeSent:function(callback){
		if( !this.onRequestWillBeSentCallbacks ) this.onRequestWillBeSentCallbacks = [];
		this.onRequestWillBeSentCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.requestWillBeSent', function(res){
			self.onRequestWillBeSentCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onResponseReceived:function(callback){
		if( !this.onResponseReceivedCallbacks ) this.onResponseReceivedCallbacks = [];
		this.onResponseReceivedCallbacks.push( callback );
		var self = this;
		this.browser && this.browser.on( 'Network.responseReceived', function(res){
			self.onResponseReceivedCallbacks.forEach( function(callback){
				callback( res );
			} )
		} );
	},

	/**
	 * 注入脚本
	 *
	 * @param script
	 * @param callback
	 */
	inject:function(script){
		this.injects.push( {
			'script':script
		} )
	}
}

module.exports = browserProxy;
