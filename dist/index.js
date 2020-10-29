"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 兼容性处理
var isChildClassOf = cc.js["isChildClassOf"];
if (!isChildClassOf) {
    isChildClassOf = cc["isChildClassOf"];
}
var ResAgent = /** @class */ (function () {
    function ResAgent() {
        //资源依赖和被依赖信息
        this._mapResDepends = {};
        //外部使用信息
        // 外部通过唯一的id使用某些资源，记录到依赖数组中，同时被使用的资源的被依赖次数相应的增加。
        this._mapResUses = {};
        this._loadingCount = 0;
        this._waitFrees = {};
    }
    ResAgent.prototype.del = function () {
    };
    ResAgent.prototype.init = function () {
    };
    /**
     * 使用资源处理参数
     */
    ResAgent.prototype._makeArgsUseRes = function () {
        if (arguments.length < 2 || typeof arguments[0] !== "string" || typeof arguments[1] !== "string") {
            throw new Error("Arguments is invalid !");
        }
        var ret = { keyUse: arguments[0], path: arguments[1] };
        for (var i = 2; i < arguments.length; ++i) {
            if (i == 2 && isChildClassOf(arguments[i], cc.RawAsset)) {
                // 判断是不是第一个参数type
                ret.type = arguments[i];
            }
            else if (typeof arguments[i] == "function") {
                // 其他情况为函数
                if (arguments.length > i + 1 && typeof arguments[i + 1] == "function") {
                    ret.onProgess = arguments[i];
                }
                else {
                    ret.onCompleted = arguments[i];
                }
            }
        }
        return ret;
    };
    /**
     * 释放资源处理参数
     */
    ResAgent.prototype._makeArgsFreeRes = function () {
        if (arguments.length < 1 || typeof arguments[0] != "string") {
            throw new Error("Arguments is invalid !");
        }
        var ret = { keyUse: arguments[0], path: arguments[1] };
        for (var i = 2; i < arguments.length; ++i) {
            ret.type = arguments[i];
        }
        return ret;
    };
    ResAgent.prototype.getResDependsInfo = function (path) {
        return this._mapResDepends[cc.loader._getReferenceKey(path)];
    };
    ResAgent.prototype.getResUseInfo = function (id) {
        return this._mapResUses[id];
    };
    ResAgent.prototype.useRes = function () {
        var _this = this;
        ++this._loadingCount;
        var resArgs = this._makeArgsUseRes.apply(this, arguments);
        var mapResDepends = this._mapResDepends;
        var mapResUses = this._mapResUses;
        var finishCallback = function (error, resource) {
            --_this._loadingCount;
            if (error) {
                if (resArgs.onCompleted)
                    resArgs.onCompleted(error);
                if (_this._loadingCount <= 0) {
                    _this._doWaitFrees();
                }
                return;
            }
            // 反向关联引用（为所有引用到的资源打上本资源引用到的标记）
            function updateDependRelations(key, item) {
                var dependsInfo = mapResDepends[key];
                //判断资源是否已经存在，并被加入依赖网。
                // 如果资源之前不存在过，或者已经被释放（numDepended === 0)
                if (dependsInfo && dependsInfo.numDepended)
                    return;
                var resDepends;
                if (!dependsInfo) {
                    resDepends = mapResDepends[key] = { depends: [], numDepended: 0 };
                }
                else {
                    resDepends = mapResDepends[key];
                }
                if (item && item.dependKeys && Array.isArray(item.dependKeys)) {
                    for (var _i = 0, _a = item.dependKeys; _i < _a.length; _i++) {
                        var depKey = _a[_i];
                        if (depKey === key)
                            continue;
                        var depItem = cc.loader._cache[depKey];
                        updateDependRelations(depKey, depItem);
                        var depInfoDepends = mapResDepends[depKey];
                        //相互记录依赖
                        resDepends.depends.push(depKey);
                        ++depInfoDepends.numDepended;
                    }
                }
            }
            //更新资源依赖
            var key = cc.loader._getReferenceKey(resArgs.path);
            var resUse = mapResUses[resArgs.keyUse];
            if (!resUse)
                mapResUses[resArgs.keyUse] = resUse = [];
            //判断之前使用被相同的使用ID使用过
            if (resUse.indexOf(key) < 0) {
                var item = _this._getItemFromLoaderCache(resArgs.path, resArgs.type);
                updateDependRelations(key, item);
                //更新使用依赖
                var resDepends = mapResDepends[key];
                resUse.push(key);
                ++resDepends.numDepended;
            }
            // 执行完成回调
            if (resArgs.onCompleted) {
                resArgs.onCompleted(null, resource);
            }
            if (_this._loadingCount <= 0) {
                _this._doWaitFrees();
            }
        };
        //移除等待释放的资源
        this._removeWaitFree(resArgs);
        // 预判是否资源已加载
        var res = cc.loader.getRes(resArgs.path, resArgs.type);
        if (res) {
            finishCallback(null, res);
        }
        else {
            cc.loader.loadRes(resArgs.path, resArgs.type, resArgs.onProgess, finishCallback);
        }
    };
    ResAgent.prototype.freeRes = function () {
        var resArgs = this._makeArgsFreeRes.apply(this, arguments);
        if (this._loadingCount > 0) {
            this._addWaitFree(resArgs);
            return;
        }
        var key = resArgs.path ? cc.loader._getReferenceKey(resArgs.path) : null;
        var mapResDepends = this._mapResDepends;
        var mapResUses = this._mapResUses;
        var resUse = mapResUses[resArgs.keyUse];
        if (key) {
            var index = resUse.indexOf(key);
            if (index > -1) {
                resUse.splice(index, 1);
                freeOneUse(key, resArgs.type);
            }
        }
        else {
            mapResUses[resArgs.keyUse] = [];
            resUse && resUse.forEach(function (key) {
                freeOneUse(key);
            });
        }
        function freeOneUse(key, type) {
            var resDepends = mapResDepends[key];
            --resDepends.numDepended;
            if (resDepends.numDepended <= 0) {
                // 释放该资源
                var depends = resDepends.depends;
                resDepends.depends = [];
                cc.loader.release(key);
                depends.forEach(function (key) {
                    freeOneUse(key);
                });
            }
        }
    };
    ResAgent.prototype._getItemFromLoaderCache = function (urlPath, type) {
        var ccloader = cc.loader;
        var item = ccloader._cache[urlPath];
        if (!item) {
            var uuid = ccloader._getResUuid(urlPath, type, null, true);
            if (uuid) {
                var ref = ccloader._getReferenceKey(uuid);
                item = ccloader._cache[ref];
            }
            else {
                return null;
            }
        }
        if (item && item.alias) {
            item = item.alias;
        }
        return item;
    };
    ResAgent.prototype._doWaitFrees = function () {
        var waitFrees = this._waitFrees;
        for (var key in waitFrees) {
            var map = waitFrees[key];
            for (var key_1 in map) {
                this.freeRes(map[key_1].keyUse, map[key_1].path, map[key_1].type);
            }
        }
        this._waitFrees = {};
    };
    ResAgent.prototype._addWaitFree = function (args) {
        if (!this._waitFrees[args.keyUse]) {
            this._waitFrees[args.keyUse] = {};
        }
        this._waitFrees[args.keyUse][args.path] = args;
    };
    ResAgent.prototype._removeWaitFree = function (args) {
        var waitFrees = this._waitFrees;
        if (waitFrees[args.keyUse]) {
            var waitFree = waitFrees[args.keyUse];
            if (args.path) {
                if (waitFree[args.path])
                    delete waitFree[args.path];
                if (!Object.keys(waitFree).length)
                    delete waitFrees[args.keyUse];
            }
            else {
                delete waitFrees[args.keyUse];
            }
        }
    };
    return ResAgent;
}());
exports.ResAgent = ResAgent;
exports.resAgent = new ResAgent();
if (window)
    window.resAgent = exports.resAgent;
