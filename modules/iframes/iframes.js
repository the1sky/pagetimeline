/**
 * Created by nant on 2014/8/28.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add iframes module done!'} );
	pagetimeline.log( 'iframes...' );

	var browser = pagetimeline.model.browser;
	browser.onLoadEventFired( function(res){
		browser.evaluate('$("iframe").length', function(err,res){
			if( res.result ){
				pagetimeline.incrMetric( 'iframe_count', res.result.value );
			}else{
				pagetimeline.setMetric( 'iframe_count', 0 );
			}
		});
	} );
}