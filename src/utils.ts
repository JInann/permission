export const isArray = (o: Object) => Array.isArray(o)
export const isObject = (o: Object) => Object.prototype.toString.call(o) === '[object Object]'
export const isString = (o: Object) => Object.prototype.toString.call(o) === '[object String]'
