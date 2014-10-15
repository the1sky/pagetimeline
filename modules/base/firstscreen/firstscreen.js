/**
 *  find slowest image in first screen
 *
 * Created by nant on 2014/7/9.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add first screen module done!'} );

	pagetimeline.log( 'first screen...' );
	var start = +new Date();
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var startTime = pagetimeline.model.startTime;

	var requestId_info = {};

	browser.onResponseReceived( function(res){
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
	} );

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			start = +new Date();
			getStartTime( function(err, res){
				if( !err && res && res.result ){
					startTime = res.result.value['navigationStart'];
				}
				getFirstScreenTime( pagetimeline );
			} );
		}, timeout );
	} );

	function getTiming(){
		return window.performance.timing;
	}

	function getStartTime(callback){
		var script = getTiming.toString() + ';getTiming()';
		browser.evaluate( script, function(err, res){
			callback( err, res );
		} );
	}

	/**
	 * 获取首屏时间
	 * @param chrome
	 */
	function getFirstScreenTime(pagetimeline){
		var requests = getRequestTimeByUrl( requestId_info );

		//计算首屏内的图形
		var str = getClientScreenImages.toString() + ';getClientScreenImages()';
		browser.evaluate( str, function(err, res){
			//计算最慢时间,timestamp为1970以来的秒
			var inClientImages = res['result']['value'];
			var slowestTime = 0;
			for( var url in inClientImages ){
				var offset = inClientImages[url];
				var urlTime = requests[url];
				pagetimeline.addOffender( 'first_screen_time', url + '  offsetLeft:' + offset.offsetLeft + '    offsetTop:' + offset.offsetTop );
				if( urlTime > slowestTime ){
					slowestTime = urlTime;
				}
			}
			// to ms
			slowestTime = parseInt( slowestTime * 1000 );
			var firstScreenTime = slowestTime - startTime
			pagetimeline.log( 'first screen done in ' + (+new Date() - start ) + 'ms' );
			pagetimeline.setMetric( 'first_screen_time', parseInt( firstScreenTime ) );
		} );
	}

	/**
	 * 形如{url:timestamp,...}
	 * @param requests
	 * @returns {{}}
	 */
	function getRequestTimeByUrl(requests){
		var requestsByUrl = {};
		for( var requestId in requests ){
			var requestInfo = requests[requestId];
			var url = requestInfo['url'];
			var timestamp = requestInfo['timestamp'];
			if( timestamp && !requestsByUrl[url] ){
				requestsByUrl[url] = timestamp;
			}
		}
		return requestsByUrl;
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
			var w = window.innerWidth || window.outerWidth || document.documentElement.clientWidth || document.body.clientWidth || document.getElementsByTagName( 'body' )[0].clientWidth;
			var h = window.innerHeight || window.outerHeight || document.documentElement.clientHeight || document.body.clientHeight || document.getElementsByTagName( ('body')[0].clientHeight );
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

				if( offsetLeft < clientWidth && offsetTop < clientHeight ){
					if( !inClientImages[src] ){
						inClientImages[src] = {
							'offsetLeft':offsetLeft,
							'offsetTop':offsetTop
						};
					}
				}
			}
			return inClientImages;
		}
		return getInClientImages();
	}
}