export declare type ProcessCallback = (completedCount: number, totalCount: number, item: any) => void;
export declare type CompletedCallback = (error: Error, resource: any) => void;
export default class ResAgent {
    private _mapResDepends;
    private _mapResUses;
    constructor();
    del(): void;
    init(): void;
    /**
     * 使用资源处理参数
     */
    private _makeArgsUseRes;
    /**
     * 释放资源处理参数
     */
    private _makeArgsFreeRes;
    getResDependsInfo(path: string): {
        numDepended: number;
        depends: string[];
    };
    getResUseInfo(id: string): string[];
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
     * @param path           要释放的url
     * @param type          资源类型
     */
    freeRes(keyUse: string): any;
    freeRes(keyUse: string, path: string): any;
    freeRes(keyUse: string, path: string, type: typeof cc.Asset): any;
}
