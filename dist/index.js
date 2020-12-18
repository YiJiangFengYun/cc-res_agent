"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var isChildClassOf=(isChildClassOf=cc.js.isChildClassOf)||cc.isChildClassOf,ResAgent=function(){function e(){this._mapResUses={},this._loadingCount=0,this._waitFrees={}}return e.prototype.del=function(){},e.prototype.init=function(){},e.prototype._makeArgsUseRes=function(){if(arguments.length<2||"string"!=typeof arguments[0]||"string"!=typeof arguments[1])throw new Error("Arguments is invalid !");for(var e={keyUse:arguments[0],path:arguments[1]},t=2;t<arguments.length;++t)2==t&&isChildClassOf(arguments[t],cc.Asset)?e.type=arguments[t]:"function"==typeof arguments[t]&&(t+1<arguments.length&&"function"==typeof arguments[t+1]?e.onProgess=arguments[t]:e.onCompleted=arguments[t]);return e},e.prototype._makeArgsFreeRes=function(){if(arguments.length<1||"string"!=typeof arguments[0])throw new Error("Arguments is invalid !");for(var e={keyUse:arguments[0],path:arguments[1]},t=2;t<arguments.length;++t)e.type=arguments[t];return e},e.prototype.getResUseInfo=function(e){return this._mapResUses[e]},e.prototype.useRes=function(){var n=this;++this._loadingCount;function e(e,t){if(--n._loadingCount,e)return o.onCompleted&&o.onCompleted(e),void(n._loadingCount<=0&&n._doWaitFrees());(e=r[o.keyUse])||(r[o.keyUse]=e=[]);var s=[o.path,o.type];e.every(function(e){return e[0]!==s[0]||e[1]!==s[1]})&&(t.addRef(),e.push(s)),o.onCompleted&&o.onCompleted(null,t),n._loadingCount<=0&&n._doWaitFrees()}var o=this._makeArgsUseRes.apply(this,arguments),r=this._mapResUses;this._removeWaitFree(o);var t=cc.resources.get(o.path,o.type);t?e(null,t):cc.resources.load(o.path,o.type,o.onProgess,e)},e.prototype.freeRes=function(){var e,t,s,n,o=this._makeArgsFreeRes.apply(this,arguments);0<this._loadingCount?this._addWaitFree(o):(e=this._mapResUses,t=e[o.keyUse],o.path?(s=[o.path,o.type],0<(n=t?t.filter(function(e){if(e[0]===s[0]&&e[1]===s[1])return e}):[]).length&&n.forEach(function(e){t.splice(t.indexOf(e),1),cc.resources.get(e[0],e[1]).decRef()})):(e[o.keyUse]=[],t&&t.forEach(function(e){cc.resources.get(e[0],e[1]).decRef()})))},e.prototype._doWaitFrees=function(){var e,o=this,t=this._waitFrees;for(e in t)!function(s){var e,n=t[s];for(e in n)!function(t){n[t].forEach(function(e){o.freeRes(s,t,null===e?void 0:e)})}(e)}(e);this._waitFrees={}},e.prototype._addWaitFree=function(e){var t=this._waitFrees[e.keyUse];t||(this._waitFrees[e.keyUse]=t={});var s=t[e.path];s||(t[e.path]=s=[]),s.indexOf(e.type||null)<0&&s.push(e.type||null)},e.prototype._removeWaitFree=function(e){var t,s,n,o=this._waitFrees;o[e.keyUse]&&(t=o[e.keyUse],e.path?(!(s=t[e.path])||-1<(n=s.indexOf(e.type||null))&&s.splice(n,1),s&&!s.length&&delete t[e.path],Object.keys(t).length||delete o[e.keyUse]):delete o[e.keyUse])},e}();exports.ResAgent=ResAgent,exports.resAgent=new ResAgent,window&&(window.resAgent=exports.resAgent);