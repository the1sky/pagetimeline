/**
 * Created by nant on 2014/8/5.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
    pagetimeline.log( 'dom complexity...' );
	callback( false, {message:'add dom complexity module done!'} );

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;
	var _ = require( 'underscore' );

	var script = function(){
		var res = {};
		var whitespacesRegExp = /^\s+$/;
		var DOMelementMaxDepth = 0;
		var dom_count = 0;
		var hidden_count = 0;
		var hidden_size = 0;
		var comment_size = 0;
		var white_space_size = 0;
		var inline_css_count = 0;
		var size = 0;

		res['dom_comment_size_offender'] = [];
		res['dom_hidden_size_offender'] = [];
		res['dom_inline_css_count_offender'] = [];

		var walk = function(node, callback, depth){
			var childNode;
			var childNodes = node && node.childNodes || [];
			depth = (depth || 1);

			for( var n = 0, len = childNodes.length; n < len; n++ ){
				childNode = childNodes[n];

				// callback can return false to stop recursive
				if( callback( childNode, depth ) !== false ){
					walk( childNode, callback, depth + 1 );
				}
			}
		};

		var getDOMPath = function(node, dontGoUpTheDom /* = false */){
			var path = [], entry = '';

			if( node === window ){
				return 'window';
			}

			while( node instanceof Node ){
				// div
				entry = node.nodeName.toLowerCase();

				// shorten the path a bit
				if( ['body', 'head', 'html'].indexOf( entry ) > -1 ){
					path.push( entry );
					break;
				}

				if( node instanceof DocumentFragment ){
					entry = 'DocumentFragment';
				}

				// div#foo
				if( node.id && node.id !== '' ){
					entry += '#' + node.id;
				}
				// div#foo.bar.test
				else if( typeof node.className === 'string' && node.className !== '' ){
					entry += '.' + node.className.trim().replace( / +/g, '.' );
				}
				// div[0] <- index of child node
				else if( node.parentNode instanceof Node ){
					entry += '[' + Array.prototype.indexOf.call( node.parentNode.childNodes, node ) + ']';
				}

				path.push( entry );

				if( dontGoUpTheDom === true ){
					break;
				}

				// go up the DOM
				node = node && node.parentNode;
			}
			return (path.length > 0) ? path.reverse().join( ' > ' ) : false;
		};

		walk( document.body, function(node, depth){
			switch( node.nodeType ){
				case Node.COMMENT_NODE:
					size = node.textContent.length + 7; // '<!--' + '-->'.length
					comment_size += size;
					// log HTML comments bigger than 64 characters
					if( size > 64 ){
						res['dom_comment_size_offender'].push( getDOMPath( node ) + ' (' + size + ' characters)' );
					}
					break;

				case Node.ELEMENT_NODE:
					dom_count++;
					DOMelementMaxDepth = Math.max( DOMelementMaxDepth, depth );

					// ignore inline <script> tags
					if( node.nodeName === 'SCRIPT' ){
						return false;
					}

					// @see https://developer.mozilla.org/en/DOM%3awindow.getComputedStyle
					var styles = window.getComputedStyle( node );

					if( styles && styles.getPropertyValue( 'display' ) === 'none' ){
						if( typeof node.innerHTML === 'string' ){
							size = node.innerHTML.length;
							// log hidden containers bigger than 1 kB
							if( size > 1024 ){
								hidden_count++;
								hidden_size += size;
								res['dom_hidden_size_offender'].push( getDOMPath( node ) + ' (' + size + ' characters)' );
							}
						}
						// don't run for child nodes as they're hidden as well
						return false;
					}

					// count nodes with inline CSS
					if( node.hasAttribute( 'style' ) ){
						inline_css_count++;
						res['dom_inline_css_count_offender'].push( getDOMPath( node ) + ' (' + node.getAttribute( 'style' ) + ')' );
					}

					break;

				case Node.TEXT_NODE:
					if( whitespacesRegExp.test( node.textContent ) ){
						white_space_size += node.textContent.length;
					}
					break;
			}
		} );

		res['dom_count'] = dom_count;
		res['dom_max_depth'] = DOMelementMaxDepth;
		res['dom_comment_size'] = comment_size;
		res['dom_hidden_count'] = hidden_count;
		res['dom_hidden_size'] = hidden_size;
		res['dom_inline_css_count'] = inline_css_count;
		res['dom_white_space_size'] = white_space_size;

		return res;
	};

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
		browser.evaluate( '(' + script.toString() + ')()', function(err, res){
			if( !err && res && res.result ){
				var result = res.result.value;
				var flag = '_offender';
				_.forEach( result, function(value, key){
					if( /_offender/.test( key ) ){
						key = key.substr( 0, key.length - flag.length );
						_.forEach( value, function(offenderEveryValue, index){
							pagetimeline.addOffender( key, offenderEveryValue );
						} );
					}else{
						pagetimeline.setMetric( key, value );
					}
				} );
			}
            pagetimeline.finishModule();
		} );
	}
}