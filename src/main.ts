import {isArray, isString} from './utils';

let _Vue: any
let _userRouterHandle: UserRouterHandle
export const power = (() => {
    const POWERS = new Set()
    const doms = new Map()
    return {
        /**
         * 校验权限 传入数组，某项返回true，则校验通过
         * @param powers
         * @returns {Promise<boolean>}
         */
        async checkPowers(powers: Array<string>): Promise<boolean> {
            for (let i = 0; i < powers.length; i++) {
                if (await this.checkPower(powers[i])) {
                    return true
                }
            }
            return false
        },
        /**
         * 返回是否有对应权限,用promise是考虑到以后结果可能是异步返回
         * @param p
         * @returns {Promise<boolean>}
         */
        checkPower(p: string): Promise<boolean> {
            return Promise.resolve(POWERS.has(p))
        },
        /**
         * 设置用户权限表，当用户权限表更新时，会重新校验
         * @param powers
         * @param isMerge
         */
        setPowers(powers: Array<string>, isMerge: boolean) {
            // 是否与旧表合并
            if (isMerge) {
                powers.forEach(item => POWERS.add(item))
            } else {
                POWERS.clear()
                powers.forEach(item => POWERS.add(item))
            }
            // 重新执行校验
            doms.forEach(item => item())
        },
        authHandle(mode: string, el: HTMLElement, value: (string | Array<string>)) {
            // 获取处理方法
            let handle = handleMap.get(mode)
            if (handle) {
                // 保存el与处理程序的关系
                doms.set(el, this.authHandle.bind(power, ...arguments))
                // 执行校验前逻辑
                handle.before && handle.before(el, value)
                // 开始校验
                // 数组
                if (isArray(value)) {
                    this.checkPowers(value).then((result: boolean) => {
                        // 校验后逻辑
                        handle.after && handle.after(el, value, result)
                    })
                }
                // 字符串
                if (isString(value)) {
                    this.checkPower(value).then((result: boolean) => {
                        // 校验后逻辑
                        handle.after && handle.after(el, value, result)
                    })
                }
            } else {
                throw new Error(`${mode}不存在`)
            }
        },
        get userPowers() {
            return [...POWERS]
        }
    }
})();
export const handleMap = new Map()
/**
 * 默认配置
 */
handleMap.set('default', {
    before(el: HTMLElement, value: Array<string>) {
        // 保存display值
        if (!el.dataset.initState) {
            el.dataset.initState = getComputedStyle(el).display
        }
        // 隐藏
        el.style.display = 'none'
    },
    after(el: HTMLElement, value: Array<string>, result: boolean) {
        // 如果有对应的权限，则设为初始状态（显示）
        if (result) {
            el.style.display = el.dataset.initState
        }
    }
})
export const directive = {
    inserted: function (el: HTMLElement, bindding: any) {
        let mode = bindding.arg
        if (!mode) {
            mode = 'default'
        }
        power.authHandle(mode, el, bindding.value)
    },
}
/**
 * 劫持页面访问
 * @param to
 * @param from
 * @param next
 */
const routerHandle = (to: any, from: any, next: Function) => {
    // 如果路由配置了权限
    if (to.meta.access) {
        power.checkPowers(to.meta.access).then(result => {
            if (result) {
                // 校验通过
                let fn = _userRouterHandle?.success
                fn ? fn(to, from, next) : next()
            } else {
                let fn = _userRouterHandle?.fail
                fn ? fn(to, from, next) : next(new Error('permission error! 您没有对应页面的权限'))
            }
        })
    } else {
        let fn = _userRouterHandle?.next
        fn ? fn(to, from, next) : next()
    }
}
export default {
    install(Vue: any, {router, userRouterHandle}: vueOption) {
        _Vue = Vue
        Vue.prototype.$power = power
        Vue.directive('power', directive)
        _userRouterHandle = userRouterHandle
        router && router.beforeEach(routerHandle)
    }
}
