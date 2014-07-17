/**
 * Created by nant on 2014/7/18.
 */

exports.run = function(pagetimeline,callback){
	var browserProxy = pagetimeline.browserProxy;
	var url = pagetimeline.url;
	var start = +new Date();

	browserProxy.onLoadEventFired(function(err,res){
		setTimeout( function(callback){
			callback(false,{message:'load page done!'});
		},pagetimeline.getParam('timeout'),callback );
	})

	browserProxy.navigate(url,function(err,res){
		if( !err ){
			pagetimeline.core.startTime = start;
		}else{
			callback(true,{message:'page open fail!'});
		}
	})
}

exports.name = 'openPage';
