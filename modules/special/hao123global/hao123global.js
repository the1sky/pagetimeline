/**
 * Created by nant on 10/14/2014.
 */

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add hao123 core module done!'} );

	var browser = pagetimeline.model.browser;

	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;
	var reload = pagetimeline.getParam( 'reload' );
	var startTime = pagetimeline.model.startTime;
	var requestUrl_info = {};
	var responseUrl_info = {};
	var startSuggestion = false;
	var startSuggestionTime = 0;
	var checkSuggestionShowId = 0;

	browser.onRequestWillBeSent( function(res){
		if( startSuggestion ){
			var request = res.request;
			var timestamp = res.timestamp;
			var url = request.url;
			requestUrl_info[url] = {
				'timestamp':timestamp
			}
		}
	} );
	browser.onResponseReceived( function(res){
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;
		if( !responseUrl_info[url] ){
			responseUrl_info[url] = {
				'timestamp':timestamp
			}
		}
		//get suggestion response
		if( /wd=iphone/.test( url ) ){
			if( requestUrl_info[url] && responseUrl_info[url] ){
				var requestTime = requestUrl_info[url].timestamp * 1000;
				var responseTime = responseUrl_info[url].timestamp * 1000;
				pagetimeline.setMetric( 'hao123_global_suggest_load_time', responseTime - requestTime );

				checkSuggestionShowId = setInterval( function(){
					var js = checkSuggestionShow.toString() + ';checkSuggestionShow()';
					browser.evaluate( js, function(err, res){
						if( res && res.result && res.result.value ){
							var endTime = +new Date();
							pagetimeline.setMetric( 'hao123_global_suggest_show_time', endTime - startSuggestionTime );
							clearInterval( checkSuggestionShowId );
						}
					} );
				}, 100 );
			}
		}
	} );

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			calculate();
		}, timeout );

	} );

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} );

	function calculate(){
		getCoreLinkTime();
		getSuggestionTime();
	}

	function getCoreLinkTime(){
		var js = getCoreLink.toString() + ';getCoreLink()';
		browser.evaluate( js, function(err, res){
			if( !err && res.result && res.result.value ){
				var coreLinks = res.result.value;
				var len = coreLinks.length;
				var slowestTime = 0;
				for( var i = 0; i < len; i++ ){
					var url = coreLinks[i];
					var urlTime = responseUrl_info[url] ? responseUrl_info[url].timestamp : 0;
					if( urlTime > slowestTime ){
						slowestTime = urlTime;
					}
					pagetimeline.addOffender( 'hao123_global_core_load_time', url + '\t' + ( parseInt( urlTime * 1000 ) - startTime ) );
				}
				pagetimeline.setMetric( 'hao123_global_core_load_time', parseInt( slowestTime * 1000 ) - startTime );
			}
		} );
	}

	function getSuggestionTime(){
		startSuggestion = true;
		var js = simulateSuggestion.toString() + ';simulateSuggestion()';
		startSuggestionTime = +new Date();
		browser.evaluate( js, function(err, res){
		} );
	}

	function simulateSuggestion(){
		var $input = $( '#searchGroupInput' );
		$input[0].value = 'iphone';
		$input.trigger( 'focus' );
		$input.trigger( 'keydown' );
	}

	/**
	 * 获取核心区图片列表
	 * @returns {Array}
	 */
	function getCoreLink(){
		var arr = [];

		//核心区图片类列表
		var url = $('.i-hot-sprites').css('background-image');
		if( url ) {
			url = /url\(['"]?([^")]+)/.exec( url ) || [];
			url = url[1];
			arr.push( url );
		}

		//页面logo地址
		arr.push( $( '#indexLogoImg' )[0].src );

		//页面搜索按钮地址
		arr.push( $( '#searchGroupLogo' )[0].src );

		return arr;
	}

	function checkSuggestionShow(){
		return ( $( '.sg' ).length > 0 );
	}
}