declare module '*.json'
declare type routerHandleFn = (to: any, from: any, next: Function) => void

interface UserRouterHandle {
    success: routerHandleFn,
    fail: routerHandleFn,
    next: routerHandleFn,
}

declare interface vueOption {
    /**
     * ((to,from,next)=>void)
     */
    router: { beforeEach: (fn: routerHandleFn) => void };
    userRouterHandle: UserRouterHandle
}
