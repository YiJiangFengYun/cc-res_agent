
// // 资源加载的处理回调
export type ProcessCallback = (completedCount: number, totalCount: number, item: any) => void;
// // 资源加载的完成回调
export type CompletedCallback = (error: Error, resource?: any) => void;


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
    //外部使用信息
    // 外部通过唯一的id使用某些资源
    private _mapResUses: { [ key: string ]: [ string, typeof cc.Asset ][] } = {};

    private _loadingCount = 0;

    private _waitFrees: { [keyUse: string]: { [path: string ]: typeof cc.Asset[] } } = {};

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
            if (i == 2 && isChildClassOf(arguments[i], cc.Asset)) {
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
        ++this._loadingCount;
        const resArgs: ArgsUseRes = this._makeArgsUseRes.apply(this, arguments);
        const mapResUses = this._mapResUses;
        const finishCallback = (error: Error, asset: cc.Asset) => {
            --this._loadingCount;
            if (error) {
                if (resArgs.onCompleted) resArgs.onCompleted(error);
                if (this._loadingCount <= 0) {
                    this._doWaitFrees();
                }
                return;
            }

            let resUse = mapResUses[resArgs.keyUse];
            if (! resUse) {
                mapResUses[resArgs.keyUse] = resUse = [];
            }

            const pair: [ string, typeof cc.Asset ] = [ resArgs.path, resArgs.type ];

            const notExists = resUse.every((item) => {
                if (item[0] === pair[0] && item[1] === pair[1]) return false;
                return true;
            });

            if (notExists) {

                asset.addRef();

                resUse.push(pair);
            }

            // 执行完成回调
            if (resArgs.onCompleted) {
                resArgs.onCompleted(null, asset);
            }

            if (this._loadingCount <= 0) {
                this._doWaitFrees();
            }
        };

        //移除等待释放的资源
        this._removeWaitFree(resArgs);

        // 预判是否资源已加载
        let res = cc.resources.get(resArgs.path, resArgs.type);
        if (res) {
            finishCallback(null, res);
        } else {
            cc.resources.load(resArgs.path, resArgs.type, resArgs.onProgess, finishCallback);
        }
    }

    /**
     * 释放资源
     * @param keyUse        标识使用的key
     * @param path          要释放的url
     * @param type          资源类型
     */
    public freeRes(keyUse: string);
    public freeRes(keyUse: string, path: string);
    public freeRes(keyUse: string, path: string, type: typeof cc.Asset);
    public freeRes() {
        let resArgs: ArgsFreeRes = this._makeArgsFreeRes.apply(this, arguments);
        if (this._loadingCount > 0) {
            this._addWaitFree(resArgs);
            return;
        }

        const mapResUses = this._mapResUses;
        const resUse = mapResUses[resArgs.keyUse];
        if (resArgs.path) {
            const pair: [ string, typeof cc.Asset ] = [ resArgs.path, resArgs.type ];
            const filtereds = resUse ? resUse.filter((item) => {
                if (item[0] === pair[0] && item[1] === pair[1]) return item;
            }) : [];

            if (filtereds.length > 0) {
                //Can only be 1
                filtereds.forEach((item) => {
                    resUse.splice(resUse.indexOf(item), 1);
                    const asset = cc.resources.get(item[0], item[1]);
                    asset.decRef();
                });
            }
        } else {
            mapResUses[resArgs.keyUse] = [];
            resUse && resUse.forEach((item) => {
                const asset = cc.resources.get(item[0], item[1]);
                asset.decRef();
            });
        }
    }

    private _doWaitFrees() {
        const waitFrees = this._waitFrees;
        for (let keyUse in waitFrees) {
            const map = waitFrees[keyUse];
            for (let path in map) {
                const types = map[path];
                types.forEach((type) => {
                    this.freeRes(keyUse, path, type === null ? undefined : type);
                })
                
            }
        }
        this._waitFrees = {};
    }

    private _addWaitFree(args: ArgsFreeRes) {
        var mapUses = this._waitFrees[args.keyUse];
        if (! mapUses) this._waitFrees[args.keyUse] = mapUses = {};
        var types = mapUses[args.path];
        if (! types) mapUses[args.path] = types = [];
        if (types.indexOf(args.type || null) < 0) {
            types.push(args.type || null);
        }
    }

    private _removeWaitFree(args: ArgsUseRes) {
        const waitFrees = this._waitFrees;
        if (waitFrees[args.keyUse]) {
            const waitFree = waitFrees[args.keyUse];
            if (args.path) {
                const types = waitFree[args.path];
                if (types) {
                    const index = types.indexOf(args.type || null);
                    if (index > -1) {
                        types.splice(index, 1);
                    }
                }
                if (types && ! types.length) delete waitFree[args.path];
                if ( ! Object.keys(waitFree).length) delete waitFrees[args.keyUse];
            } else {
                delete waitFrees[args.keyUse];
            }
        }
    }
}

export const resAgent = new ResAgent();
if (window) (window as any).resAgent = resAgent;