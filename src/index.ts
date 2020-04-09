
// // 资源加载的处理回调
export type ProcessCallback = (completedCount: number, totalCount: number, item: any) => void;
// // 资源加载的完成回调
export type CompletedCallback = (error: Error, resource: any) => void;


interface ArgsUseRes {
    keyUse: string;
    path: string,
    type?: typeof cc.Asset,
    onCompleted?: CompletedCallback,
    onProgess?: ProcessCallback,
}

interface ArgsFreeRes {
    keyUse: string,
    path: string,
    type?: typeof cc.Asset,
}

// 兼容性处理
let isChildClassOf = cc.js["isChildClassOf"]
if (!isChildClassOf) {
    isChildClassOf = cc["isChildClassOf"];
}

export class ResAgent {
    //资源依赖和被依赖信息
    private _mapResDepends: { [key: string]: { numDepended: number, depends: string[] } } = {};

    //外部使用信息
    // 外部通过唯一的id使用某些资源，记录到依赖数组中，同时被使用的资源的被依赖次数相应的增加。
    private _mapResUses: { [ key: string ]: string[] } = {};

    public constructor() {

    }

    public del() {

    }

    public init() {

    }

    /**
     * 使用资源处理参数
     */
    private _makeArgsUseRes(): ArgsUseRes {
        if (arguments.length < 2 || typeof arguments[0] !== "string" || typeof arguments[1] !== "string") {
           throw new Error(`Arguments is invalid !`);
        }
        let ret: ArgsUseRes = { keyUse: arguments[0], path: arguments[1] };
        for (let i = 2; i < arguments.length; ++i) {
            if (i == 2 && isChildClassOf(arguments[i], cc.RawAsset)) {
                // 判断是不是第一个参数type
                ret.type = arguments[i];
            } else if (typeof arguments[i] == "function") {
                // 其他情况为函数
                if (arguments.length > i + 1 && typeof arguments[i + 1] == "function") {
                    ret.onProgess = arguments[i];
                } else {
                    ret.onCompleted = arguments[i];
                }
            }
        }
        return ret;
    }

    /**
     * 释放资源处理参数
     */
    private _makeArgsFreeRes(): ArgsFreeRes {
        if (arguments.length < 1 || typeof arguments[0] != "string") {
            throw new Error(`Arguments is invalid !`);
        }
        let ret: ArgsFreeRes = { keyUse: arguments[0], path: arguments[1] };
        for (let i = 2; i < arguments.length; ++i) {
            ret.type = arguments[i];
        }
        return ret;
    }

    public getResDependsInfo(path: string) {
        return this._mapResDepends[(cc.loader as any)._getReferenceKey(path)];
    }

    public getResUseInfo(id: string) {
        return this._mapResUses[id];
    }

    /**
     * 使用资源
     * @param keyUse        标识使用的key
     * @param path           资源url
     * @param type          资源类型，默认为null
     * @param onProgess     加载进度回调
     * @param onCompleted   加载完成回调
     */
    public useRes(keyUse:  string, path: string);
    public useRes(keyUse:  string, path: string, onCompleted: CompletedCallback);
    public useRes(keyUse:  string, path: string, onProgess: ProcessCallback, onCompleted: CompletedCallback);
    public useRes(keyUse:  string, path: string, type: typeof cc.Asset);
    public useRes(keyUse:  string, path: string, type: typeof cc.Asset, onCompleted: CompletedCallback);
    public useRes(keyUse:  string, path: string, type: typeof cc.Asset, onProgess: ProcessCallback, onCompleted: CompletedCallback);
    public useRes() {
        const resArgs: ArgsUseRes = this._makeArgsUseRes.apply(this, arguments);
        const mapResDepends = this._mapResDepends;
        const mapResUses = this._mapResUses;
        const finishCallback = (error: Error, resource: any) => {
            if (error) {
                throw error;
            }
            // 反向关联引用（为所有引用到的资源打上本资源引用到的标记）
            function updateDependRelations(key: string, item: any) {
                const dependsInfo = mapResDepends[key];
                //判断资源是否已经存在，并被加入依赖网。
                // 如果资源之前不存在过，或者已经被释放（numDepended === 0)
                if (dependsInfo && dependsInfo.numDepended) return;

                let resDepends: { numDepended: number, depends: string[] };
                if ( ! dependsInfo) {
                    resDepends = mapResDepends[key] = { depends: [], numDepended: 0 };
                } else {
                    resDepends = mapResDepends[key];
                }

                if (item && item.dependKeys && Array.isArray(item.dependKeys)) {
                    for (let depKey of item.dependKeys) {
                        const depItem = (cc.loader as any)._cache[depKey];
                        updateDependRelations(depKey, depItem);
                        const depInfoDepends = mapResDepends[depKey];
                        //相互记录依赖
                        resDepends.depends.push(depKey);
                        ++depInfoDepends.numDepended;
                    }
                }
            }

            //更新资源依赖
            const item = cc.loader.getRes(resArgs.path, resArgs.type);
            const key = (cc.loader as any)._getReferenceKey(resArgs.path);
            updateDependRelations(key, item);

            //更新使用依赖
            const resDepends = mapResDepends[key];
            let resUse = mapResUses[resArgs.keyUse];
            if (! resUse) mapResUses[resArgs.keyUse] = resUse = [];
            //判断之前使用被相同的使用ID使用过
            if (resUse.indexOf(key) < 0) {
                resUse.push(key);
                ++resDepends.numDepended;
            }

            // 执行完成回调
            if (resArgs.onCompleted) {
                resArgs.onCompleted(error, resource);
            }
        };

        // 预判是否资源已加载
        let res = cc.loader.getRes(resArgs.path, resArgs.type);
        if (res) {
            finishCallback(null, res);
        } else {
            cc.loader.loadRes(resArgs.path, resArgs.type, resArgs.onProgess, finishCallback);
        }
    }

    /**
     * 释放资源
     * @param keyUse        标识使用的key
     * @param path           要释放的url
     * @param type          资源类型
     */
    public freeRes(keyUse: string);
    public freeRes(keyUse: string, path: string);
    public freeRes(keyUse: string, path: string, type: typeof cc.Asset);
    public freeRes() {
        let resArgs: ArgsFreeRes = this._makeArgsFreeRes.apply(this, arguments);
        const key = resArgs.path ? (cc.loader as any)._getReferenceKey(resArgs.path) : null;
        const mapResDepends = this._mapResDepends;
        const mapResUses = this._mapResUses;
        const resUse = mapResUses[resArgs.keyUse];
        if (key) {
            const index = resUse.indexOf(key);
            if (index > -1) {
                resUse.splice(index, 1);
                freeOneUse(key, resArgs.type);
            }
        } else {
            mapResUses[resArgs.keyUse] = [];
            resUse.forEach((key) => {
                freeOneUse(key);
            })
        }
        function freeOneUse(key: string, type?: typeof cc.Asset) {
            const resDepends = mapResDepends[key];
            --resDepends.numDepended;
            if (--resDepends.numDepended <= 0) {
                // 释放该资源
                const depends = resDepends.depends;
                resDepends.depends = [];

                cc.loader.release(key);

                depends.forEach((key) => {
                    freeOneUse(key);
                });
            }
        }
    }
}

export const resAgent = new ResAgent();