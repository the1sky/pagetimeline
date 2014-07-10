/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline,callback) {
	pagetimeline.log('webspeed:' + pagetimeline.startTime)
	callback( false, {} );
}
