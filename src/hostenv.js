(function (_global) {
    "use strict"
    const HOST_ENV_READY_EVENT = "host_env_ready";
    _global.__hostEnvReadyCallbacks = []
    _global.addEventListener(HOST_ENV_READY_EVENT, function (e) {
        __hostEnvReadyCallbacks.forEach(function (callback) {
            callback.apply()
        }, false)
    });

    _global.addHostEnvReadyListener = function (fn) {
        if (__hostEnvReadyCallbacks.find(fn) === undefined)
            __hostEnvReadyCallbacks.push(fn)
    }

    _global.removeHostEnvReadyListener = function (fn) {
        let idx = __hostEnvReadyCallbacks.findIndex(fn)
        if (idx !== -1) {
            __hostEnvReadyCallbacks.splice(idx, 1)
        }
    }

    _global.clearHostEnvReadyListeners = function () {
        __hostEnvReadyCallbacks.length = 0
    }

    _global.fireHostEnvReadyEvent = function () {
        _global.dispatchEvent(new Event(HOST_ENV_READY_EVENT))
    }

})(window);
