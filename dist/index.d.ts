export declare type ProcessCallback = (completedCount: number, totalCount: number, item: any) => void;
export declare type CompletedCallback = (error: Error, resource?: any) => void;
export declare class ResAgent {
    private _mapResUses;
    private _loadingCount;
    private _waitFrees;
    /**
     * 标记是否已经被销毁了
     */
    private _isDestroyed;
    private _time;
    private _intervalIndex;
    private _delayFree;
    constructor(delayFree?: number);
    del(): void;
    init(delayFree?: number): void;
    getResUseInfo(id: string): [string, typeof cc.Asset][];
    /**
     * 使用资源
     * @param keyUse        标识使用的key
     * @param path           资源url
     * @param type          资源类型，默认为null
     * @param onProgess     加载进度回调
     * @param onCompleted   加载完成回调
     */
    useRes(keyUse: string, path: string): any;
    useRes(keyUse: string, path: string, onCompleted: CompletedCallback): any;
    useRes(keyUse: string, path: string, onProgess: ProcessCallback, onCompleted: CompletedCallback): any;
    useRes(keyUse: string, path: string, type: typeof cc.Asset): any;
    useRes(keyUse: string, path: string, type: typeof cc.Asset, onCompleted: CompletedCallback): any;
    useRes(keyUse: string, path: string, type: typeof cc.Asset, onProgess: ProcessCallback, onCompleted: CompletedCallback): any;
    /**
     * 释放资源
     * @param keyUse        标识使用的key
     * @param path          要释放的url
     * @param type          资源类型
     */
    freeRes(keyUse: string): any;
    freeRes(keyUse: string, path: string): any;
    freeRes(keyUse: string, path: string, type: typeof cc.Asset): any;
    private _checkAndDoWaitFrees;
    private _doFreeRes;
    private _addWaitFree;
    private _removeWaitFree;
    private _update;
    private _clear;
    /**
     * 使用资源处理参数
     */
    private _makeArgsUseRes;
    /**
     * 释放资源处理参数
     */
    private _makeArgsFreeRes;
}
export declare const resAgent: ResAgent;
