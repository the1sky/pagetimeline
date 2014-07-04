/**
 * 通过chrome debugging protocol进行性能分析的脚本，
 * 需要真实chrome浏览器及开启chrome debugging protocol服务：
 * ./chrome --remote-debugging-port=9222
 *
 * 暂时不支持命令行传入url，可以通过Commander扩展
 * 暂时支持的功能：
 *     首屏
 *
 * Created by nant on 2014/5/28.
 */

var Chrome = require( 'chrome-remote-interface' );
var startTime = 0;
var requestId_info = {};
var request_info = {};

Chrome( function(chrome){
	with( chrome ){
		on( 'Network.requestWillBeSent', function(message){
			var requestId = message.requestId;
			var url = message.request.url;
			if( !requestId_info[requestId] ){
				requestId_info[requestId] = {
					'url':url
				}
			}
		} );
		on( 'Network.loadingFinished', function(data){
			var requestId = data['requestId'];
			var timestamp = data['timestamp'];
			requestId_info[requestId]['timestamp'] = timestamp;
		} );

		Runtime.enable();
		Network.enable();
		Page.enable();
		startTime = new Date().getTime();
		Page.navigate( {'url':'http://www.pconline.com.cn'} );

		//很重要
		setTimeout( getFirstScreenTime, 5000, chrome );
	}
} );

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
			console.log( 'first screen time(ms):\n', firstScreenTime + 'ms' );
			console.log( 'first screen time(s):\n', ( firstScreenTime / 1000 ) + 's' );
		} );
	}
}

/**
 * 获取首屏内的图片
 * @returns {*[]}
 */
function getClientScreenImages(){
	//获取指定的标签内的样式属性
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

	//转化为标准Array
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

	//获取所有图片资源
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
	var availableDoms = [];
	var len = doms.length;
	for( var i = 0; i < len; i++ ){
		var dom = doms[i];
		if( dom.src ){
			var offset = calOffset( dom.parentNode, dom.offsetLeft, dom.offsetTop );
			offset["src"] = dom.src;
			availableDoms.push( offset );
		}else if( window.getComputedStyle( dom, "" ).getPropertyValue( "background-image" ) != "none" ){
			var url = window.getComputedStyle( dom, "" ).getPropertyValue( "background-image" );
			if( url ) url = /url\(['"]?([^")]+)/.exec( url ) || [];
			url = url[1];
			if( url ){
				var offset = calOffset( dom.parentNode, dom.offsetLeft, dom.offsetTop );
				offset['src'] = url;
				availableDoms.push( offset );
			}
		}
	}

	//判断是否在首屏区域内,并返回在首屏内的所有图片
	var inClientResult = {};
	var clientWidth = window.innerWidth || window.outerWidth || document.documentElement.clientWidth || document.body.clientWidth || document.getElementsByTagName( 'body' )[0].clientWidth;
	var clientHeight = window.innerHeight || window.outerHeight || document.documentElement.clientHeight || document.body.clientHeight || document.getElementsByTagName( ('body')[0].clientHeight );
	len = availableDoms.length;
	for( i = 0; i < len; i++ ){
		var domInfo = availableDoms[i];
		var domSrc = domInfo['src'];
		var domOffsetLeft = domInfo['ol'];
		var domOffsetTop = domInfo['ot'];

		if( domOffsetLeft < clientWidth || domOffsetTop < clientHeight ){
			if( !inClientResult[domSrc] ){
				inClientResult[domSrc] = domSrc;
			}
		}
	}
	return inClientResult;
}