import { IDisposable, editor } from "monaco-editor"
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import ITextModel = editor.ITextModel

const EditorEvents = require("./EditorEvents.json")
const TextModelEvents = require("./TextModelEvents.json")

export type EventCallback = (eventId: number, event?: any | null) => void

class EventHandler {
    readonly eventId: number
    readonly monacoEventHandler: IDisposable

    private _isDisposed: boolean = false

    constructor(eventId: number, monacoEventHandler: IDisposable) {
        this.eventId = eventId
        this.monacoEventHandler = monacoEventHandler
    }

    dispose() {
        if (!this._isDisposed) {
            this.monacoEventHandler.dispose()
            this._isDisposed = true
            // console.log("disposed")
        }
    }

    isDisposed(): boolean {
        return this._isDisposed
    }
}

export abstract class EventBridge {
    private listenedEvents = new Map<number, EventHandler>()

    listen(eventId: number, eventCallback: EventCallback): any | null {
        this.unlisten(eventId)
        let monacoEventHandler: IDisposable = this.bindMonacoEvent(eventId, eventCallback)
        this.listenedEvents.set(eventId, new EventHandler(eventId, monacoEventHandler))
    }

    unlisten(eventId: number): void {
        if (this.isListened(eventId)) {
            let handler = this.listenedEvents.get(eventId)
            handler.dispose()
            this.listenedEvents.delete(eventId)
        }
    }

    isListened(eventId: number): boolean {
        return this.listenedEvents.has(eventId)
    }

    abstract bindMonacoEvent(eventId: number, eventCallback: EventCallback): IDisposable
}


export class EditorEventBridge extends EventBridge {
    private _eventSource: IStandaloneCodeEditor
    constructor(eventSource: IStandaloneCodeEditor) {
        super();
        this._eventSource = eventSource
    }

    override bindMonacoEvent(eventId: number, eventCallback: EventCallback): IDisposable {
        switch (eventId) {
            case EditorEvents.onContextMenu:
                return this._eventSource.onContextMenu((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidAttemptReadOnlyEdit:
                return this._eventSource.onDidAttemptReadOnlyEdit(() => {
                    eventCallback(eventId)
                })

            case EditorEvents.onDidBlurEditorText:
                return this._eventSource.onDidBlurEditorText(() => {
                    eventCallback(eventId)
                })

            case EditorEvents.onDidBlurEditorWidget:
                return this._eventSource.onDidBlurEditorWidget(() => {
                    eventCallback(eventId)
                })

            case EditorEvents.onDidChangeConfiguration:
                return this._eventSource.onDidChangeConfiguration((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeCursorPosition:
                return this._eventSource.onDidChangeCursorPosition((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeCursorSelection:
                return this._eventSource.onDidChangeCursorSelection((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModel:
                return this._eventSource.onDidChangeModel((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModelContent:
                return this._eventSource.onDidChangeModelContent((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModelDecorations:
                return this._eventSource.onDidChangeModelDecorations((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModelLanguage:
                return this._eventSource.onDidChangeModelLanguage((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModelLanguageConfiguration:
                return this._eventSource.onDidChangeModelLanguageConfiguration((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidChangeModelOptions:
                return this._eventSource.onDidChangeModelOptions((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidContentSizeChange:
                return this._eventSource.onDidContentSizeChange((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidFocusEditorText:
                return this._eventSource.onDidFocusEditorText(() => {
                    eventCallback(eventId)
                })

            case EditorEvents.onDidFocusEditorWidget:
                return this._eventSource.onDidFocusEditorWidget(() => {
                    eventCallback(eventId)
                })

            case EditorEvents.onDidLayoutChange:
                return this._eventSource.onDidLayoutChange((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidPaste:
                return this._eventSource.onDidPaste((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidScrollChange:
                return this._eventSource.onDidScrollChange((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onKeyDown:
                return this._eventSource.onKeyDown((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onKeyUp:
                return this._eventSource.onKeyUp((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onMouseDown:
                return this._eventSource.onMouseDown((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onMouseLeave:
                return this._eventSource.onMouseLeave((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onMouseUp:
                return this._eventSource.onMouseUp((e) => {
                    eventCallback(eventId, e)
                })

            case EditorEvents.onDidDispose:
                return this._eventSource.onDidDispose(() => {
                    eventCallback(eventId)
                })

            default:
                throw new Error("Unknow eventId of editor event.(eventId=" + eventId + ")");
        }
    }
}

export class TextModelEventBridge extends EventBridge {
    private _eventSource: ITextModel

    constructor(eventSource: ITextModel) {
        super();
        this._eventSource = eventSource
    }

    override bindMonacoEvent(eventId: number, eventCallback: EventCallback): IDisposable {
        switch (eventId) {
            case TextModelEvents.onDidChangeAttached:
                return this._eventSource.onDidChangeAttached(() => {
                    eventCallback(eventId)
                })

            case TextModelEvents.onDidChangeContent:
                return this._eventSource.onDidChangeContent((e) => {
                    eventCallback(eventId, e)
                })

            case TextModelEvents.onDidChangeDecorations:
                return this._eventSource.onDidChangeDecorations((e) => {
                    eventCallback(eventId, e)
                })

            case TextModelEvents.onDidChangeLanguage:
                return this._eventSource.onDidChangeLanguage((e) => {
                    eventCallback(eventId, e)
                })

            case TextModelEvents.onDidChangeLanguageConfiguration:
                return this._eventSource.onDidChangeLanguageConfiguration((e) => {
                    eventCallback(eventId, e)
                })

            case TextModelEvents.onDidChangeOptions:
                return this._eventSource.onDidChangeOptions((e) => {
                    eventCallback(eventId, e)
                })

            case TextModelEvents.onWillDispose:
                return this._eventSource.onWillDispose(() => {
                    eventCallback(eventId)
                })

            default:
                throw new Error("Unknow eventId of editor event.(eventId=" + eventId + ")");
        }
    }
}
