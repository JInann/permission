'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const isArray = (o) => Array.isArray(o);
const isString = (o) => Object.prototype.toString.call(o) === '[object String]';

let _userRouterHandle;
const power = (() => {
    const POWERS = new Set();
    const doms = new Map();
    return {
        /**
         * 校验权限 传入数组，某项返回true，则校验通过
         * @param powers
         * @returns {Promise<boolean>}
         */
        checkPowers(powers) {
            return __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < powers.length; i++) {
                    if (yield this.checkPower(powers[i])) {
                        return true;
                    }
                }
                return false;
            });
        },
        /**
         * 返回是否有对应权限,用promise是考虑到以后结果可能是异步返回
         * @param p
         * @returns {Promise<boolean>}
         */
        checkPower(p) {
            return Promise.resolve(POWERS.has(p));
        },
        /**
         * 设置用户权限表，当用户权限表更新时，会重新校验
         * @param powers
         * @param isMerge
         */
        setPowers(powers, isMerge) {
            // 是否与旧表合并
            if (isMerge) {
                powers.forEach(item => POWERS.add(item));
            }
            else {
                POWERS.clear();
                powers.forEach(item => POWERS.add(item));
            }
            // 重新执行校验
            doms.forEach(item => item());
        },
        authHandle(mode, el, value) {
            // 获取处理方法
            let handle = handleMap.get(mode);
            if (handle) {
                // 保存el与处理程序的关系
                doms.set(el, this.authHandle.bind(power, ...arguments));
                // 执行校验前逻辑
                handle.before && handle.before(el, value);
                // 开始校验
                // 数组
                if (isArray(value)) {
                    this.checkPowers(value).then((result) => {
                        // 校验后逻辑
                        handle.after && handle.after(el, value, result);
                    });
                }
                // 字符串
                if (isString(value)) {
                    this.checkPower(value).then((result) => {
                        // 校验后逻辑
                        handle.after && handle.after(el, value, result);
                    });
                }
            }
            else {
                throw new Error(`${mode}不存在`);
            }
        },
        get userPowers() {
            return [...POWERS];
        }
    };
})();
const handleMap = new Map();
/**
 * 默认配置
 */
handleMap.set('default', {
    before(el, value) {
        // 保存display值
        if (!el.dataset.initState) {
            el.dataset.initState = getComputedStyle(el).display;
        }
        // 隐藏
        el.style.display = 'none';
    },
    after(el, value, result) {
        // 如果有对应的权限，则设为初始状态（显示）
        if (result) {
            el.style.display = el.dataset.initState;
        }
    }
});
const directive = {
    inserted: function (el, bindding) {
        let mode = bindding.arg;
        if (!mode) {
            mode = 'default';
        }
        power.authHandle(mode, el, bindding.value);
    },
};
/**
 * 劫持页面访问
 * @param to
 * @param from
 * @param next
 */
const routerHandle = (to, from, next) => {
    // 如果路由配置了权限
    if (to.meta.access) {
        power.checkPowers(to.meta.access).then(result => {
            if (result) {
                // 校验通过
                let fn = _userRouterHandle === null || _userRouterHandle === void 0 ? void 0 : _userRouterHandle.success;
                fn ? fn(to, from, next) : next();
            }
            else {
                let fn = _userRouterHandle === null || _userRouterHandle === void 0 ? void 0 : _userRouterHandle.fail;
                fn ? fn(to, from, next) : next(new Error('permission error! 您没有对应页面的权限'));
            }
        });
    }
    else {
        let fn = _userRouterHandle === null || _userRouterHandle === void 0 ? void 0 : _userRouterHandle.next;
        fn ? fn(to, from, next) : next();
    }
};
var main = {
    install(Vue, { router, userRouterHandle }) {
        Vue.prototype.$power = power;
        Vue.directive('power', directive);
        _userRouterHandle = userRouterHandle;
        router && router.beforeEach(routerHandle);
    }
};

exports.default = main;
exports.directive = directive;
exports.handleMap = handleMap;
exports.power = power;
