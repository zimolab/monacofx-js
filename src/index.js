import { SystemClipboard } from "./clipboard-fix";
import {Editor} from "./Editor";
import {_ObjectCreator} from "./ObjectCreator";

require("./index.css");
require("./hostenv");

(function (_global){
    'use strict';
    _global.addHostEnvReadyListener(function (){
        // 以下对象来自宿主环境
        const Logger = _global.javaLogger;
        const javaMonacoEditor = _global.javaEditorFx;
        const javaClipboard = _global.javaClipboard;
        // 重定向控制台输出
        if (Logger != null) {
            console.log = function (message) {
                Logger.log(message);
            }
            console.error = function(message) {
                Logger.error(message)
            }
            console.debug = function(message) {
                Logger.info(message)
            }
            console.info = function(message) {
                Logger.info(message)
            }
        }
        SystemClipboard.init(javaClipboard)
        _global.ME = {};
        _global.ME.ObjectCreator = new _ObjectCreator();
        _global.ME.editor = new Editor(document.body);
        _global.ME.editor.setJavaEditorProxy(javaMonacoEditor);
        _global.onresize = function () {
            _global.ME.editor.autoLayout();
        }
    });
})(window);