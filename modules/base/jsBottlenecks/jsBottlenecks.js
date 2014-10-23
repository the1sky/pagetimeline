/**
 * Created by nant on 2014/8/5.
 */

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	callback( false, {message:'add js bottlenecks module done!'} );
    pagetimeline.log('headers...');
    pagetimeline.finishModule();

	//todo, using timeline
}