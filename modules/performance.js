/**
 * 通过chrome debugging protocol进行性能分析的脚本，
 * 暂时支持的功能：
 *     首屏
 *     白屏
 *     加载时间
 *
 * Created by nant on 2014/5/28.
 */

var Chrome = require( 'chrome-remote-interface' );
var startTime = 0;
var requestId_info = {};
var request_info = {};
var done = false;

function work(program){
	Chrome( {host:'localhost',port:program.port},function(chrome){
		with( chrome ){
			on( 'Network.requestWillBeSent', function(message){
				var requestId = message.requestId;
				var url = message.request.url;
				var timestamp = message.timestamp;
				if( !requestId_info[requestId] ){
					requestId_info[requestId] = {
						'url':url
					}
				}
			} );
			on( 'Network.loadingFinished', function(data){
				var requestId = data['requestId'];
				var timestamp = data['timestamp'];
				if( !requestId_info[requestId] ){
					requestId_info[requestId] = {}
				}
				requestId_info[requestId]['timestamp'] = timestamp;
			} );

			//todo, async
			send('Page.enable',{}, function(err,response){
				if( !err ){
					send('Runtime.enable',{}, function(err,response){
						"use strict";
						if( !err ){
							send('Network.enable',{}, function(err,response){
								if( !err ){
									startTime = new Date().getTime();
									Page.navigate( {'url':program.url} );

									//很重要
									setTimeout( analyzePerformance, 5000, chrome );
								}
							});
						}
					});
				}
			})
		}
	} );
}
/**
 * 分析性能
 *
 * @param chrome
 */
function analyzePerformance(chrome){
	//首屏时间
	getFirstScreenTime( chrome );

	//总加载时间
	getLoadTime( chrome );

	//白屏时间
	getWhiteScreenTime( chrome );
}

/**
 * 获取首屏时间
 * @param chrome
 */
function getFirstScreenTime(chrome){
	//整理url对应的timestamp
	for( var requestId in requestId_info ){
		var requestInfo = requestId_info[requestId];
		var url = requestInfo['url'];
		var timestamp = requestInfo['timestamp'];
		if( timestamp && !request_info[url] ){
			request_info[url] = timestamp;
		}
	}
	console.log( 'url timestamp:\n', request_info );

	//计算首屏内的图形
	with( chrome ){
		var str = getClientScreenImages.toString() + ';getClientScreenImages()';
		send( 'Runtime.evaluate', {'expression':str, returnByValue:true}, function(err, result){
			//计算最慢时间,timestamp为1970以来的秒
			var inClientImages = result['result']['value'];
			console.log( 'first screen images:\n', inClientImages );
			var slowestTime = 0;
			for( var url in inClientImages ){
				var urlTime = request_info[url];
				if( urlTime > slowestTime ){
					slowestTime = urlTime;
				}
			}
			// to ms
			slowestTime = parseInt( slowestTime * 1000 );
			var firstScreenTime = slowestTime - startTime;
			console.log( 'first screen time(ms):\n', firstScreenTime + 'ms', ( firstScreenTime / 1000 ) + 's' );
		} );
	}
}

/**
 * 获取整个页面的加载时间
 */
function getLoadTime(chrome){
	function actualGetLoadTime(){
		var timing = performance.timing;
		return timing.loadEventEnd - timing.navigationStart;
	};

	with( chrome ){
		var str = actualGetLoadTime.toString() + ';actualGetLoadTime()';
		send( 'Runtime.evaluate', {'expression':str, returnByValue:true}, function(err, data){
			var loadTime = data.result['value'];
			console.log( 'load time:\n', loadTime + 'ms', ( loadTime / 1000 ) + 'ms');
		});
	}
}

/**
 * 获取白屏时间
 *
 * @param chrome
 */
function getWhiteScreenTime(chrome){
	function actualGetWhiteScreenTime(){
		var loadtimes = chrome.loadTimes();
		var firstPaintTime = loadtimes.firstPaintTime;
		var requestTime = loadtimes.requestTime;
		return firstPaintTime - requestTime;
	}

	with( chrome ){
		var str = actualGetWhiteScreenTime.toString() + ';actualGetWhiteScreenTime()';
		send( 'Runtime.evaluate', {'expression':str, returnByValue:true}, function(err, data){
			var whiteScreenTime = data.result['value'];
			exports.done = true;
			console.log( 'white screen time:\n', whiteScreenTime + 'ms', ( whiteScreenTime / 1000 ) + 's' );
		});
	};
}

/**
 * 获取首屏内的图片
 * @returns {*[]}
 */
function getClientScreenImages(){
	/**
	 *
	 * 获取指定的标签内的样式属性
	 *
	 * @param tagElements
	 * @param property
	 * @returns {Array}
	 */
	function getStylePropertyDoms(tagElements, property){
		var result = [];
		var len = tagElements.length;
		for( var i = 0; i < len; i++ ){
			var tagDom = tagElements[i];
			var styleValue = window.getComputedStyle( tagDom, "" ).getPropertyValue( property );
			if( styleValue != "none" ) result.push( tagDom );
		}
		return result;
	}

	/**
	 *
	 * 转化为标准Array
	 *
	 * @param obj
	 * @returns {Array}
	 */
	function makeArray(obj){
		try{
			return [].slice.call( obj );
		}catch( e ){//for IE
			var j, i = 0, rs = [];
			while( j = obj[i] )
				rs[i++] = j;
			return rs;
		}
	}

	/**
	 * 获取浏览器窗口宽度和高度
	 *
	 * @returns {{width: (Number|number), height: (Number|number|NodeList)}}
	 */
	function getClientSize(){
		var w = window.innerWidth || window.outerWidth || document.documentElement.clientWidth ||
				document.body.clientWidth || document.getElementsByTagName( 'body' )[0].clientWidth;
		var h = window.innerHeight || window.outerHeight || document.documentElement.clientHeight ||
				document.body.clientHeight || document.getElementsByTagName( ('body')[0].clientHeight );
		return {
			'width':w,
			'height':h
		}
	}

	/**
	 *
	 * 获取所有图片资源
	 *
	 * @returns {Array}
	 */
	function getallImagesInfo(){
		var imageDoms = makeArray( document.getElementsByTagName( "img" ) );
		var allBackgroundImageDoms = getStylePropertyDoms( document.getElementsByTagName( "*" ), "background-image" );
		var doms = imageDoms.concat( allBackgroundImageDoms );

		var calOffset = function(node, offsetLeft, offsetTop){
			var parentNode = node.parentNode;
			if( parentNode && parentNode.offsetLeft != undefined ){
				var parentOffsetLeft = parentNode.offsetLeft;
				var parentOffsetTop = parentNode.offsetTop;
				return calOffset( parentNode, offsetLeft + parentOffsetLeft, offsetTop + parentOffsetTop );
			}else{
				return {ol:offsetLeft, ot:offsetTop};
			}
		};
		var imagesInfo = [];
		var len = doms.length;
		for( var i = 0; i < len; i++ ){
			var dom = doms[i];
			if( dom.src ){
				var offset = calOffset( dom.parentNode, dom.offsetLeft, dom.offsetTop );
				offset["src"] = dom.src;
				imagesInfo.push( offset );
			}else if( window.getComputedStyle( dom, "" ).getPropertyValue( "background-image" ) != "none" ){
				var url = window.getComputedStyle( dom, "" ).getPropertyValue( "background-image" );
				if( url ) url = /url\(['"]?([^")]+)/.exec( url ) || [];
				url = url[1];
				if( url ){
					var offset = calOffset( dom.parentNode, dom.offsetLeft, dom.offsetTop );
					offset['src'] = url;
					imagesInfo.push( offset );
				}
			}
		}
		return imagesInfo;
	}

	/**
	 * 获取首屏内的所有图片
	 *
	 * @returns {{}}
	 */
	function getInClientImages(){
		var imagesInfo = getallImagesInfo();
		var clientSize = getClientSize();
		var clientWidth = clientSize.width;
		var clientHeight = clientSize.height;
		var len = imagesInfo.length;
		var inClientImages = {};
		for( var i = 0; i < len; i++ ){
			var imageInfo = imagesInfo[i];
			var src = imageInfo['src'];
			var offsetLeft = imageInfo['ol'];
			var offsetTop = imageInfo['ot'];

			if( offsetLeft < clientWidth || offsetTop < clientHeight ){
				if( !inClientImages[src] ){
					inClientImages[src] = src;
				}
			}
		}
		return inClientImages;
	}

	return getInClientImages();
}

exports.work = work;
exports.done = done;