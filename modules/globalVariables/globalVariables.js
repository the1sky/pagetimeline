/**
 * Created by nant on 2014/8/4.
 */

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	callback( false, {message:'add global variables module done!'});

    pagetimeline.log( 'global variables...' );
	var browser = pagetimeline.model.browser;
	browser.onLoadEventFired(function(res){
		var script = getGlobalVariables.toString() + ';getGlobalVariables()';
		browser.evaluate(script,function(err,res){
			if( !err && res && res.result ){
				if( res.result.value && res.result.value.globalVariables ){
					pagetimeline.setMetric('global_variables'); // @desc number of JS globals variables @offenders
					var globalVariables = res.result.value.globalVariables;
					var len = globalVariables.length;
					for( var i = 0; i < len; i++ ){
						pagetimeline.incrMetric('global_variables');
						pagetimeline.addOffender( 'global_variables', globalVariables[i] );
					}
				}

				if( res.result.value && res.result.value.globalVariablesFalsy ){
					pagetimeline.setMetric('global_variables_falsy'); // @desc number of JS globals variables with falsy value @offenders
					var globalVariablesFalsy = res.result.value.globalVariablesFalsy;
					var len = globalVariablesFalsy.length;
					for( var i = 0; i < len; i++ ){
						pagetimeline.incrMetric('global_variables_falsy');
						pagetimeline.addOffender( 'global_variables_falsy', globalVariables[i] );
					}
				}
			}
            pagetimeline.finishModule();
		});
	});

	function getGlobalVariables(){
		var globals = {},
			allowed = ['Components','XPCNativeWrapper','XPCSafeJSObjectWrapper','getInterface','netscape','GetWeakReference','window', 'performance', 'getGlobalVariables'],
			varName,
			iframe,
			cleanWindow;

		if (!document.body) {
			return false;
		}

		// create an empty iframe to get the list of core members
		iframe = document.createElement('iframe');
		iframe.style.display = 'none';
		iframe.src = 'about:blank';
		document.body.appendChild(iframe);

		cleanWindow = iframe.contentWindow;

		for (varName in cleanWindow) {
			allowed.push(varName);
		}

		// get all members of window and filter them
		for (varName in window) {
			if ( (allowed.indexOf(varName) > -1) || (typeof window[varName] === 'undefined') /* ignore variables exposed by window.__defineGetter__ */) {
				continue;
			}

			// filter out 0, 1, 2, ...
			if (/^\d+$/.test(varName)) {
				continue;
			}

			if( !globals['globalVariables'] ){
				globals['globalVariables'] = [];
			}
			globals['globalVariables'].push( varName );

			if ([false, null].indexOf(window[varName]) > -1) {
				if( !globals['globalVariablesFalsy'] ){
					globals['globalVariablesFalsy'] = [];
				}
				globals['globalVariablesFalsy'].push( varName + ' = ' + JSON.stringify(window[varName]));
			}
		}
		// cleanup (issue #297)
		document.body.removeChild(iframe);

		return globals;
	}
}