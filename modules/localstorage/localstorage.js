/**
 * Created by nant on 2014/7/28.
 */
exports.version = '0.1';
exports.name = 'localstorage';

exports.module = function(pagetimeline, callback){
	var browser = pagetimeline.model.browser;

	browser.onLoadEventFired(function(res){
		var funcStr = storageSize.toString() + ';storageSize()';
		browser.evaluate( funcStr, function(err,res){
			if( !err && res && res.result ){
				pagetimeline.setMetric('localstorage_size', res.result.value );
			}
            pagetimeline.finishModule();
		});
	});

	callback(false,{message:'add localstorage module done!'});
    pagetimeline.log('localstorage...');

	function storageSize() {
		var numKeys = function(storage){
			if ( "undefined" != typeof(storage.length) ) {
				return storage.length;
			}
			else {
				len = 0;
				for ( var key in storage ) {
					len++;
				}
				return len;
			}
		}
		var storage = localStorage;
		var numkeys = numKeys(storage);
		var bytes = 0;
		for ( var i = 0; i < numkeys; i++ ) {
			var key = storage.key(i);
			var val = storage.getItem(key);
			bytes += key.length + val.length;
		}
		return bytes;
	}
}