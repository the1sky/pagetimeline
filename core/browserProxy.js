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

    this.emitter = new (require( 'events' ).EventEmitter)();

	browserType = "chrome";
	if( browserType == 'chrome' ){
		this.Network = {
			CachedResources:{},
			Headers:{},
			Initiator:{},
			LoaderId:{},
			Request:{},
			RequestId:{},
			RresourceTiming:{},
			Response:{},
			Timestamp:{},
			WebSocketFrame:{},
			WebSocketRequest:{},
			WebSocketResponse:{},
			canClearBrowserCache:function(params, callback){
			},
			canClearBrowserCookies:function(params, callback){
			},
			clearBrowserCache:function(params, callback){
			},
			clearBrowserCookies:function(params, callback){
			},
			dataReceived:function(handler){
			},
			disable:function(params, callback){
			},
			enable:function(params, callback){
			},
			getResponseBody:function(params, callback){
			},
			loadResourceForFrontend:function(params, callback){
			},
			loadingFailed:function(hnadler){
			},
			replayXHR:function(params, callback){
			},
			requestServedFromCache:function(params, callback){
			},
			requestWillBeSent:function(handler){
			},
			responseReceived:function(handler){
			},
			setCacheDisabled:function(params, callback){
			},
			setExtraHTTPHeaders:function(params, callback){
			},
			setUserAgentOverride:function(params, callback){
			},
			webSocketClosed:function(handler){
			},
			webSocketCreated:function(handler){
			},
			webSocketFrameError:function(handler){
			},
			webSocketFrameReceived:function(handler){
			},
			webSocketFrameSent:function(handler){
			},
			webSocketHandshakeResponseReceived:function(handler){
			},
			webSocketWillSendHandshakeRequest:function(handler){
			}
		};

		this.Page = {
			Cookie:{},
			Frame:{},
			FrameId:{},
			FrameResourceTree:{},
			NavigationEntry:{},
			Quota:{},
			ResourceType:{},
			ScreencastFrameMetadata:{},
			ScriptIdentifier:{},
			SearchMatch:{},
			Usage:{},
			UsageItem:{},
			addScriptToEvaluateOnLoad:function(params, callback){},
			canScrencast:function(params, callback){},
			captureScreenshot:function(params, callback){},
			clearDeviceOrientationOverride:function(params, callback){},
			clearGeolocationOverride:function(params, callback){},
			deleteCookie:function(params, callback){},
			disable:function(params, callback){},
			domContentEventFired:function(handler){},
			enable:function(params,callback){},
			frameAttached:function(handler){},
			frameClearedScheduledNavigation:function(handler){},
			frameDetached:function(handler){},
			frameNavigated:function(handler){},
			frameResized:function(handler){},
			frameScheduledNavigation:function(handler){},
			frameStartedLoading:function(handler){},
			frameStoppedLoading:function(handler){},
			getCookies:function(params,callback){},
			getNavigationHistory:function(params,callback){},
			getResourceContent:function(params,callback){},
			getResourceTree:function(params,callback){},
			getScriptExecutionStatus:function(params,callback){},
			handleJavaScriptDialog:function(params,callback){},
			javascriptDialogClosed:function(handler){},
			javascriptDialogOpening:function(handler){},
			loadEventFired:function(handler){},
			navigate:function(params,callback){},
			navigateToHistoryEntry:function(params,callback){},
			queryUsageAndQuota:function(params,callback){},
			reload:function(params,callback){},
			removeScriptToEvaluateOnLoad:function(params,callback){},
			screencastFrame:function(handler){},
			screencastVisibilityChanged:function(params,callback){},
			scriptsEnabled:function(handler){},
			searchInResource:function(params,callback){},
			setContinuousPaintingEnabled:function(params,callback){},
			setDeviceMetricsOverride:function(params,callback){},
			setDeviceOrientationOverride:function(params,callback){},
			setDocumentContent:function(params,callback){},
			setEmulatedMedia:function(params,callback){},
			setGeolocationOverride:function(params,callback){},
			setScriptExecutionDisabled:function(params,callback){},
			setShowDebugBorders:function(params,callback){},
			setShowFPSCounter:function(params,callback){},
			setShowPaintRects:function(params,callback){},
			setShowScrollBottleneckRects:function(params,callback){},
			setShowViewportSizeOnResize:function(params,callback){},
			setTouchEmulationEnabled:function(params,callback){},
			startScreencast:function(params,callback){},
			stopScreencast:function(params,callback){}
		};

		this.Runtime = {
			CallArgument:{},
			ExecutionContextDescription:{},
			ExecutionContextId:{},
			InternalPropertyDescriptor:{},
			ObjectPreview:{},
			PropertyDescriptor:{},
			PropertyPreview:{},
			RemoteObject:{},
			RemoteObjectId:{},
			callFunctionOn:function(params,callback){},
			disable:function(params,callback){},
			enable:function(params,callback){},
			evaluate:function(params,callback){},
			executionContextCreated:function(handler){},
			getProperties:function(params,callback){},
			releaseObject:function(params,callback){},
			releaseObjectGroup:function(params,callback){},
			run:function(params,callback){}
		};

		this.Timeline = {
			DOMCounters:{},
			TimelineEvent:{},
			disable:function(params, callback){
			},
			enable:function(params, callback){
			},
			eventRecorded:function(handler){
			},
			start:function(params, callback){
			},
			started:function(handler){
			},
			stop:function(params, callback){
			},
			stopped:function(handler){
			}
		};

		this.Console = {
			enable:function(params,callback){},
			disable:function(params,callback){},
			clearMessage:function(params,callback){},
			setMonitoringXHREnabled:function(params,callback){},
			addInspectedNode:function(params,callback){},
			addInspectedHeapObject:function(params,callback){},
			messageAdded:function(callback){},
			messageRepeatCountUpdated:function(callback){},
			messagesCleared:function(callback){}
		};

		this.callbacks = [];
		this.chooseTab = function(){};
	}
}



/**
 *
 * @param callback
 */
browserProxy.prototype = {
    emit: function() {
        this.emitter.emit.apply(this.emitter, arguments);
    },

    on: function(ev, fn) {
        this.emitter.on(ev, fn);
    },

    once: function(ev, fn) {
        this.emitter.once(ev, fn);
    },

	init:function(callback){
		var Chrome = require( 'chrome-remote-interface' );
		var self = this;
		var notifier = Chrome( {host:this.host, port:this.port}, function(browser){
			self.browser = browser;
			self.connected = browser ? true : false;
			if( browser ){
				//general
				self.Network = browser.Network;
				self.Page = browser.Page;
				self.Timeline = browser.Timeline;
				self.Runtime = browser.Runtime;
				self.Console= browser.Console;
				self.callbacks = browser.callbacks;
				self.chooseTab = browser.chooseTab;
			}
			callback( browser );
		} );

        notifier.on( 'error', function(res){
            self.emit('error', res );
        });
	},

	/**
	 *
	 * @param ignoreCache
	 * @param scriptToEvaluateOnload
	 * @param callback
	 */
	reloadPage:function(ignoreCache, scriptToEvaluateOnload, callback){
		this.browser && this.browser.Page.reload({ignoreCache:ignoreCache, scriptToEvaluateOnLoad:scriptToEvaluateOnload},function(err,res){
			callback( err, res );
		})
	},

	/**
	 *
	 * @param url
	 * @param callback
	 */
	navigate:function(url, callback){
		this.browser && this.browser.Page.navigate({url:url},function(err,res){
			callback( err, res );
		})
	},

	/**
	 *
	 * @param callback
	 */
	onDomContentEventFired:function(callback){
		this.browser && this.browser.Page.domContentEventFired(function(res){
			callback( res );
		})
	},

	/**
	 *
	 * @param callback
	 */
	onLoadEventFired:function(callback){
		this.browser && this.browser.Page.loadEventFired(function(res){
			callback( res );
		})
	},

	/**
	 *
	 * @param expression
	 * @param objectGroup
	 * @param contextId
	 * @param returnByValue
	 * @param callback
	 */
	evaluate:function(expression, callback){
		this.browser && this.browser.Runtime.evaluate( {expression:expression, returnByValue:true}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onExecutionContextCreated:function(callback){
		this.browser && this.browser.Runtime.executionContextCreated({}, function(res){
			callback( res );
		});
	},

	/**
	 *
	 * @param maxCallStackDepth
	 * @param callback
	 */
	startTimeline:function(maxCallStackDepth, callback){
		this.browser && this.browser.Timeline.start({maxCallStackDepth:maxCallStackDepth}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	stopTimeline:function(callback){
		this.browser && this.browser.Timeline.stop({}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onTimelineRecorded:function(callback){
		this.browser && this.browser.Timeline.eventRecorded(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param cacheDisabled
	 * @param callback
	 */
	setCacheDisabled:function(cacheDisabled, callback){
		this.browser && this.browser.Network.setCacheDisabled({cacheDisabled:cacheDisabled}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param headers
	 * @param callback
	 */
	setExtraHTTPHeaders:function(headers, callback){
		this.browser && this.browser.Network.setExtraHTTPHeaders({headers:headers}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param userAgent
	 * @param callback
	 */
	setUserAgentOverride:function(userAgent, callback){
		this.browser && this.browser.Network.setUserAgentOverride({userAgent:userAgent}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	clearBrowserCache:function(callback){
		this.browser && this.browser.Network.clearBrowserCache({},function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	canClearBrowserCookies:function(callback){
		this.browser && this.browser.Network.canClearBrowserCookies({}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param id
	 * @param callback
	 */
	clearBrowserCookies:function(callback){
		this.browser && this.browser.Network.clearBrowserCookies({}, function(err, res){
			callback( err, res );
		} );
	},

	/**
	 *
	 * @param callback
	 */
	onDataReceived:function(callback){
		this.browser && this.browser.Network.dataReceived(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onLoadingFailed:function(callbck){
		this.browser && this.browser.Network.loadingFailed(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onLoadingFinished:function(callbck){
		this.browser && this.browser.Network.loadingFinished(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onRequestServedFromCache:function(callback){
		this.browser && this.browser.Network.requestServedFromCache(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onRequestWillBeSent:function(callback){
		this.browser && this.browser.Network.requestWillBeSent(function(res){
				callback( res );
		} );
	},

	/**
	 *
	 * @param callbck
	 */
	onResponseReceived:function(callback){
		this.browser && this.browser.Network.responseReceived(function(res){
				callback( res );
		} );
	},

	/**
	 * send RDP comand
	 *
	 * @param command
	 * @param params
	 * @param callback
	 */
	sendCommand:function(command,params,callback){
		this.browser.send(command, params, callback);
	},

	/**
	 *  listen any RDP event
	 *
	 * @param callback
	 */
	onEvent:function(callback){
		this.browser.on( 'event', callback );
	},

	/**
	 * close web socket connection, for testing performance with cache
	 */
	closeConnection:function(){
		this.browser && this.browser.close();
	}
}

module.exports = browserProxy;
