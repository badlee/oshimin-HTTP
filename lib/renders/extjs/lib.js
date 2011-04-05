var Lib  = {
	extend : {
		__extended : {},
		__require : function(){
			for(var i=0;i<count(arguments);i++){
				if(typeof arguments[i] == "string"){
					if(typeof this[arguments[i]] == "function"){
						this[arguments[i]]();
					}
				}
			}
		},
		
		string : function(){
			Object.extend(String, {
			  interpret: function(value) {
				return value == null ? '' : String(value);
			  },
			  specialChar: {
				'\b': '\\b',
				'\t': '\\t',
				'\n': '\\n',
				'\f': '\\f',
				'\r': '\\r',
				'\\': '\\\\'
			  }
			});
			Object.extend(String.prototype, (function() {
			  var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
				typeof JSON.parse === 'function' &&
				JSON.parse('{"test": true}').test;

			  function prepareReplacement(replacement) {
				if (Object.isFunction(replacement)) return replacement;
				var template = new Template(replacement);
				return function(match) { return template.evaluate(match) };
			  }
			  function gsub(pattern, replacement) {
				var result = '', source = this, match;
				replacement = prepareReplacement(replacement);

				if (Object.isString(pattern))
				  pattern = RegExp.escape(pattern);

				if (!(pattern.length || pattern.source)) {
				  replacement = replacement('');
				  return replacement + source.split('').join(replacement) + replacement;
				}

				while (source.length > 0) {
				  if (match = source.match(pattern)) {
					result += source.slice(0, match.index);
					result += String.interpret(replacement(match));
					source  = source.slice(match.index + match[0].length);
				  } else {
					result += source, source = '';
				  }
				}
				return result;
			  }
			  function sub(pattern, replacement, count) {
				replacement = prepareReplacement(replacement);
				count = Object.isUndefined(count) ? 1 : count;

				return this.gsub(pattern, function(match) {
				  if (--count < 0) return match[0];
				  return replacement(match);
				});
			  }
			   function scan(pattern, iterator) {
				this.gsub(pattern, iterator);
				return String(this);
			  }
			  function truncate(length, truncation) {
				length = length || 30;
				truncation = Object.isUndefined(truncation) ? '...' : truncation;
				return this.length > length ?
				  this.slice(0, length - truncation.length) + truncation : String(this);
			  }
			  function strip() {
				return this.replace(/^\s+/, '').replace(/\s+$/, '');
			  }
			  function stripTags() {
				return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
			  }
			  function stripScripts() {
				return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
			  }
			  function extractScripts() {
				var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
					matchOne = new RegExp(Prototype.ScriptFragment, 'im');
				return (this.match(matchAll) || []).map(function(scriptTag) {
				  return (scriptTag.match(matchOne) || ['', ''])[1];
				});
			  }
			  function evalScripts() {
				return this.extractScripts().map(function(script) { return eval(script) });
			  }
			  function escapeHTML() {
				return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
			  }
			  function unescapeHTML() {
				// Warning: In 1.7 String#unescapeHTML will no longer call String#stripTags.
				return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
			  }
			   function toQueryParams(separator) {
				var match = this.strip().match(/([^?#]*)(#.*)?$/);
				if (!match) return { };

				return match[1].split(separator || '&').inject({ }, function(hash, pair) {
				  if ((pair = pair.split('='))[0]) {
					var key = decodeURIComponent(pair.shift()),
						value = pair.length > 1 ? pair.join('=') : pair[0];
						
					if (value != undefined) value = decodeURIComponent(value);

					if (key in hash) {
					  if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
					  hash[key].push(value);
					}
					else hash[key] = value;
				  }
				  return hash;
				});
			  }
			  function toArray() {
				return this.split('');
			  }
			  function succ() {
				return this.slice(0, this.length - 1) +
				  String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
			  }
			  function times(count) {
				return count < 1 ? '' : new Array(count + 1).join(this);
			  }
			  function camelize() {
				return this.replace(/-+(.)?/g, function(match, chr) {
				  return chr ? chr.toUpperCase() : '';
				});
			  }
			  function capitalize() {
				return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
			  }
			  function underscore() {
				return this.replace(/::/g, '/')
						   .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
						   .replace(/([a-z\d])([A-Z])/g, '$1_$2')
						   .replace(/-/g, '_')
						   .toLowerCase();
			  }
			  function dasherize() {
				return this.replace(/_/g, '-');
			  }
			  function inspect(useDoubleQuotes) {
				var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
				  if (character in String.specialChar) {
					return String.specialChar[character];
				  }
				  return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
				});
				if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
				return "'" + escapedString.replace(/'/g, '\\\'') + "'";
			  }
			  function unfilterJSON(filter) {
				return this.replace(filter || Prototype.JSONFilter, '$1');
			  }
			  function isJSON() {
				var str = this;
				if (str.blank()) return false;
				str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
				str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
				str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
				return (/^[\],:{}\s]*$/).test(str);
			  }
			  function evalJSON(sanitize) {
				var json = this.unfilterJSON(),
					cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
				if (cx.test(json)) {
				  json = json.replace(cx, function (a) {
					return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				  });
				}
				try {
				  if (!sanitize || json.isJSON()) return eval('(' + json + ')');
				} catch (e) { }
				throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
			  }
			  
			  function parseJSON() {
				var json = this.unfilterJSON();
				return JSON.parse(json);
			  }
			  function include(pattern) {
				return this.indexOf(pattern) > -1;
			  }
			  function startsWith(pattern) {
				// We use `lastIndexOf` instead of `indexOf` to avoid tying execution
				// time to string length when string doesn't start with pattern.
				return this.lastIndexOf(pattern, 0) === 0;
			  }
			  function endsWith(pattern) {
				var d = this.length - pattern.length;
				// We use `indexOf` instead of `lastIndexOf` to avoid tying execution
				// time to string length when string doesn't end with pattern.
				return d >= 0 && this.indexOf(pattern, d) === d;
			  }
			  function empty() {
				return this == '';
			  }
			  function blank() {
				return /^\s*$/.test(this);
			  }
			  function interpolate(object, pattern) {
				return new Template(this, pattern).evaluate(object);
			  }

			  return {
				gsub:           gsub,
				sub:            sub,
				scan:           scan,
				truncate:       truncate,
				// Firefox 3.5+ supports String.prototype.trim
				// (`trim` is ~ 5x faster than `strip` in FF3.5)
				strip:          String.prototype.trim || strip,
				stripTags:      stripTags,
				stripScripts:   stripScripts,
				extractScripts: extractScripts,
				evalScripts:    evalScripts,
				escapeHTML:     escapeHTML,
				unescapeHTML:   unescapeHTML,
				toQueryParams:  toQueryParams,
				parseQuery:     toQueryParams,
				toArray:        toArray,
				succ:           succ,
				times:          times,
				camelize:       camelize,
				capitalize:     capitalize,
				underscore:     underscore,
				dasherize:      dasherize,
				inspect:        inspect,
				unfilterJSON:   unfilterJSON,
				isJSON:         isJSON,
				evalJSON:       NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
				include:        include,
				startsWith:     startsWith,
				endsWith:       endsWith,
				empty:          empty,
				blank:          blank,
				interpolate:    interpolate
			  };
			})());
		},
		array : function(){
			if("array" in this.__extended){
				return;
			}else{
				this.__extended["array"] = true;
			}
			Array.from = function (iterable) {
			  if (!iterable) return [];
			  // Safari <2.0.4 crashes when accessing property of a node list with property accessor.
			  // It nevertheless works fine with `in` operator, which is why we use it here
			  if ('toArray' in Object(iterable)) return iterable.toArray();
			  var length = iterable.length || 0, results = new Array(length);
			  while (length--) results[length] = iterable[length];
			  return results;
			};
			(function() {
			  var arrayProto = Array.prototype,
				  slice = arrayProto.slice,
				  _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

			  function each(iterator, context) {
				for (var i = 0, length = this.length >>> 0; i < length; i++) {
				  if (i in this) iterator.call(context, this[i], i, this);
				}
			  }
			  if (!_each) _each = each;
			  
			  function clear() {
				this.length = 0;
				return this;
			  }

			  function first() {
				return this[0];
			  }

			  function last() {
				return this[this.length - 1];
			  }

			  function compact() {
				return this.select(function(value) {
				  return value != null;
				});
			  }

			  function flatten() {
				return this.inject([], function(array, value) {
				  if (Object.isArray(value))
					return array.concat(value.flatten());
				  array.push(value);
				  return array;
				});
			  }

			  function without() {
				var values = slice.call(arguments, 0);
				return this.select(function(value) {
				  return !values.include(value);
				});
			  }

			  function reverse(inline) {
				return (inline === false ? this.toArray() : this)._reverse();
			  }

			  function uniq(sorted) {
				return this.inject([], function(array, value, index) {
				  if (0 == index || (sorted ? array.last() != value : !array.include(value)))
					array.push(value);
				  return array;
				});
			  }

			  function intersect(array) {
				return this.uniq().findAll(function(item) {
				  return array.detect(function(value) { return item === value });
				});
			  }

			  function clone() {
				return slice.call(this, 0);
			  }

			  function size() {
				return this.length;
			  }

			  function inspect() {
				return '[' + this.map(Object.inspect).join(', ') + ']';
			  }

			  function indexOf(item, i) {
				i || (i = 0);
				var length = this.length;
				if (i < 0) i = length + i;
				for (; i < length; i++)
				  if (this[i] === item) return i;
				return -1;
			  }

			  function lastIndexOf(item, i) {
				i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
				var n = this.slice(0, i).reverse().indexOf(item);
				return (n < 0) ? n : i - n - 1;
			  }

			  // Replaces a built-in function. No PDoc needed.
			  function concat() {
				var array = slice.call(this, 0), item;
				for (var i = 0, length = arguments.length; i < length; i++) {
				  item = arguments[i];
				  if (Object.isArray(item) && !('callee' in item)) {
					for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
					  array.push(item[j]);
				  } else {
					array.push(item);
				  }
				}
				return array;
			  }

			  Object.extend(arrayProto, Enumerable);

			  if (!arrayProto._reverse)
				arrayProto._reverse = arrayProto.reverse;

			  Object.extend(arrayProto, {
				_each:     _each,
				clear:     clear,
				first:     first,
				last:      last,
				compact:   compact,
				flatten:   flatten,
				without:   without,
				reverse:   reverse,
				uniq:      uniq,
				intersect: intersect,
				clone:     clone,
				toArray:   clone,
				size:      size,
				inspect:   inspect
			  });

			  // fix for opera
			  var CONCAT_ARGUMENTS_BUGGY = (function() {
				return [].concat(arguments)[0][0] !== 1;
			  })(1,2)

			  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

			  // use native browser JS 1.6 implementation if available
			  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
			  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
			})();
		},
		date : function(){
			if("date" in this.__extended){
				return;
			}else{
				this.__extended["date"] = true;
			}
			(function(proto) {
				  function toISOString() {
					return this.getUTCFullYear() + '-' +
					  (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
					  this.getUTCDate().toPaddedString(2) + 'T' +
					  this.getUTCHours().toPaddedString(2) + ':' +
					  this.getUTCMinutes().toPaddedString(2) + ':' +
					  this.getUTCSeconds().toPaddedString(2) + 'Z';
				  }
				  function toJSON() {
					return this.toISOString();
				  }
				  if (!proto.toISOString) proto.toISOString = toISOString;
				  if (!proto.toJSON) proto.toJSON = toJSON;
				  
				})(Date.prototype);
		},
		function : function(){
			if("function" in this.__extended){
				return;
			}else{
				this.__extended["function"] = true;
			}
			Object.extend(Function.prototype, (function() {
			  var slice = Array.prototype.slice;

			  function update(array, args) {
				var arrayLength = array.length, length = args.length;
				while (length--) array[arrayLength + length] = args[length];
				return array;
			  }

			  function merge(array, args) {
				array = slice.call(array, 0);
				return update(array, args);
			  }
			  function argumentNames() {
				var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
				  .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
				  .replace(/\s+/g, '').split(',');
				return names.length == 1 && !names[0] ? [] : names;
			  }
			  function bind(context) {
				if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
				var __method = this, args = slice.call(arguments, 1);
				return function() {
				  var a = merge(args, arguments);
				  return __method.apply(context, a);
				}
			  }
			  function bindAsEventListener(context) {
				var __method = this, args = slice.call(arguments, 1);
				return function(event) {
				  var a = update([event || window.event], args);
				  return __method.apply(context, a);
				}
			  }
			  function curry() {
				if (!arguments.length) return this;
				var __method = this, args = slice.call(arguments, 0);
				return function() {
				  var a = merge(args, arguments);
				  return __method.apply(this, a);
				}
			  }
			  function delay(timeout) {
				var __method = this, args = slice.call(arguments, 1);
				timeout = timeout * 1000;
				return window.setTimeout(function() {
				  return __method.apply(__method, args);
				}, timeout);
			  }
			  function defer() {
				var args = update([0.01], arguments);
				return this.delay.apply(this, args);
			  }
			  function wrap(wrapper) {
				var __method = this;
				return function() {
				  var a = update([__method.bind(this)], arguments);
				  return wrapper.apply(this, a);
				}
			  }
			  function methodize() {
				if (this._methodized) return this._methodized;
				var __method = this;
				return this._methodized = function() {
				  var a = update([this], arguments);
				  return __method.apply(null, a);
				};
			  }
			  return {
				argumentNames:       argumentNames,
				bind:                bind,
				bindAsEventListener: bindAsEventListener,
				curry:               curry,
				delay:               delay,
				defer:               defer,
				wrap:                wrap,
				methodize:           methodize
			  }
			})());
		}
	},
	class : (function() {
		var IS_DONTENUM_BUGGY = (function(){
			for (var p in { toString: 1 }) {
			  if (p === 'toString') return false;
			}
			return true;
		  })();
		  function subclass() {};
		  function create() {
			var parent = null, properties = $A(arguments);
			if (Object.isFunction(properties[0]))
			  parent = properties.shift();

			function klass() {
			  this.initialize.apply(this, arguments);
			}

			Object.extend(klass, Class.Methods);
			klass.superclass = parent;
			klass.subclasses = [];

			if (parent) {
			  subclass.prototype = parent.prototype;
			  klass.prototype = new subclass;
			  parent.subclasses.push(klass);
			}

			for (var i = 0, length = properties.length; i < length; i++)
			  klass.addMethods(properties[i]);

			if (!klass.prototype.initialize)
			  klass.prototype.initialize = Prototype.emptyFunction;

			klass.prototype.constructor = klass;
			return klass;
		  }
		function addMethods(source) {
			var ancestor   = this.superclass && this.superclass.prototype,
				properties = Object.keys(source);

			// IE6 doesn't enumerate `toString` and `valueOf` (among other built-in `Object.prototype`) properties,
			// Force copy if they're not Object.prototype ones.
			// Do not copy other Object.prototype.* for performance reasons
			if (IS_DONTENUM_BUGGY) {
			  if (source.toString != Object.prototype.toString)
				properties.push("toString");
			  if (source.valueOf != Object.prototype.valueOf)
				properties.push("valueOf");
			}

			for (var i = 0, length = properties.length; i < length; i++) {
			  var property = properties[i], value = source[property];
			  if (ancestor && Object.isFunction(value) &&
				  value.argumentNames()[0] == "$super") {
				var method = value;
				value = (function(m) {
				  return function() { return ancestor[m].apply(this, arguments); };
				})(property).wrap(method);

				value.valueOf = method.valueOf.bind(method);
				value.toString = method.toString.bind(method);
			  }
			  this.prototype[property] = value;
			}

			return this;
		  }

		  return {
			create: create,
			Methods: {
			  updatePrototype: addMethods
			}
		  };
	})(),
	file : {
		addFile : {},
		include : function (filename, filetype){
			if ((filename+"|"+filetype) in this.addFile){
				return false;
			}
			if (filetype=="js"){ //if filename is a external JavaScript file
				var fileref=document.createElement('script')
				fileref.setAttribute("type","text/javascript")
				fileref.setAttribute("src", filename)
			}
			else if (filetype=="css"){ //if filename is an external CSS file
				var fileref=document.createElement("link")
				fileref.setAttribute("rel", "stylesheet")
				fileref.setAttribute("type", "text/css")
				fileref.setAttribute("href", filename)
			}
			if (typeof fileref!="undefined"){
				this.addFile[filename+"|"+filetype] = 1;
				document.getElementsByTagName("head")[0].appendChild(fileref);
				return true;
			}
			return undefined;
		},
		remove : function (filename, filetype){
			var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist from
			var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
			var allsuspects=document.getElementsByTagName(targetelement)
			for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
				if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1){
					allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
					if ((filename+"|"+filetype) in this.addFile){
						delete this.addFile[filename+"|"+filetype];
					}
				}
			}
		},
		replace : function (oldfilename, newfilename, filetype){
			var targetelement=(filetype=="js")? "script" : ((filetype=="css")? "link" : "none") //determine element type to create nodelist using
			var targetattr=(filetype=="js")? "src" : ((filetype=="css")? "href" : "none") //determine corresponding attribute to test for
			var allsuspects=document.getElementsByTagName(targetelement);
			for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
				if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename)!=-1){				
					var newelement=createjscssfile(newfilename, filetype);
					allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
					if ((oldfilename+"|"+filetype) in this.addFile){
						delete this.addFile[oldfilename+"|"+filetype];
						this.addFile[newfilename+"|"+filetype] = 1;
					}
				}
			}
		}
	}
}

if(module && module.exports) module.exports = Lib;
