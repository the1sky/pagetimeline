/**
 * Created by nant on 2014/7/12.
 */

exports.run = function(pagetimeline,callback){
	var browser = pagetimeline.core.browser;
	var startTime = +new Date();
	browser.send( 'Page.navigate', {'url':pagetimeline.url}, function(err, response){
		if( !err ){
			pagetimeline.core.startTime = startTime;
			exports.output = startTime;
			setTimeout( function(callback){
				callback(false,{message:'page open success!'});
			},pagetimeline.getParam('timeout'),callback );
		}else{
			callback(true,{message:'page open fail!'});
		}
	} );
}

exports.name = 'page';
exports.after = 'network,runtime,timeline';
exports.output = null;