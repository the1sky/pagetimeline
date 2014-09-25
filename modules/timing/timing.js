/**
 * Created by nant on 2014/7/9.
 */

exports.version = '1.0'

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'timing...' );
	var start = +new Date();
	var browser = pagetimeline.model.browser;

	browser.onLoadEventFired( function(res){
		var str = getTiming.toString() + ';getTiming()';

		browser.evaluate( str, function(err, res){
			if( !err && res && res.result ){
				var timing = res.result.value;
				pagetimeline.log( 'timing done in ' + (+new Date() - start ) + 'ms' );
				pagetimeline.setMetric( 'timing', timing );
				for( var timingKey in timing ){
					pagetimeline.addOffender( 'timing', timingKey + ':' + timing[timingKey] );
				}

				//child section
				var navigationStart = timing['navigationStart'];

				//redirect
				var redirectStart = timing['redirectStart'];
				var redirectEnd = timing['redirectEnd'];
				if( redirectEnd > redirectStart ){
					pagetimeline.setMetric( 'timing_redirect', redirectEnd - redirectStart );
				}

				//app cache
				var fetchStart = timing['fetchStart'];
				var domainLookupStart = timing['domainLookupStart'];
				if( domainLookupStart > fetchStart ){
					pagetimeline.setMetric( 'timing_appcache', domainLookupStart - fetchStart );
				}

				//dns
				var domainLookupEnd = timing['domainLookupEnd'];
				if( domainLookupEnd > domainLookupStart ){
					pagetimeline.setMetric( 'timing_dns', domainLookupEnd - domainLookupStart );
				}


				//tcp
				var connectStart = timing['connectStart'];
				var secureConnectionStart = timing['secureConnectionStart'];
				var connectEnd = timing['connectEnd'];
				if( connectEnd > connectStart ){
					pagetimeline.setMetric( 'timing_tcp', connectEnd - connectStart );
				}
				if( secureConnectionStart && ( connectEnd > secureConnectionStart ) ){
					pagetimeline.setMetric( 'timing_tcp_secure', connectEnd - secureConnectionStart );
				}

				//ttfb
				var responseStart = timing['responseStart'];
				if( responseStart > navigationStart ){
					pagetimeline.setMetric( 'timing_ttfb', responseStart - navigationStart );
				}
			}
            pagetimeline.finishModule();
		} );

	} );

	function getTiming(){
		return window.performance.timing;
	}

	callback( false, {message:'add timing module done!'} );
}

exports.name = 'timing'