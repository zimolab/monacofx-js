# 项目说明
本项目是MonacoEditorFx项目的一部分，它为MonacoEditorFx项目集成Monaco Editor提供了web层面的实现（包括js、html、css）。
本质上它就是对Monaco Editor中主要API的封装，以便在MonacoEditorFx的代码（主要使用kotlin）中能够更自然且方便地调用Monaco Editor的API。

## hostenv.js
在js全局对象（window）上定义了HOST_ENV_READY_EVENT事件，该事件由kotlin触发，其触发表明js所依赖的宿主环境（kotlin）已经准备就绪，相关的kotlin对象已经注入到js上下文中，在js中可以安全地调用这些对象了。

## index.html/index.js
入口文件。

## editor.ts
主要封装了Monaco中IStandaloneEditor中的相关API，并且实现了JS-Kotlin双向调用的机制（主要用于将Monaco Editor的事件桥接到Kotlin中）。

## model.ts
主要封装了ITextModel中的API，同样实现了跨语言的双向调用，以及事件桥接等机制。

## ObjectCreator.ts
向kotlin暴露某些js对象的构造函数，便于在kotlin中创建这些对象的实例。

## EditorEvents.json/TextModelEvents.json
事件桥接机制的一部分，定义了Editor和TextModel中事件的ID，每个事件对应一个不同的ID，在kotlin中依靠这些ID来对事件进行区分和处理。

## 其他
样式文件等。