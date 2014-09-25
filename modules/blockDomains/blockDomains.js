/**
 * Created by nant on 2014/8/5.
 */


exports.version = '0.1';

exports.module = function(pagetimeline,callback){
    pagetimeline.log( 'block domain...' );
	callback( false, {message:'add block domain module done!'} );
    pagetimeline.finishModule();
}