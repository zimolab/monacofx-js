import * as monaco from "monaco-editor"
import {
    editor,
    IKeyboardEvent, IPosition, IRange,
    IScrollEvent, ISelection, Selection
} from "monaco-editor"
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions
import INewScrollPosition = editor.INewScrollPosition
import IActionDescriptor = editor.IActionDescriptor
import IEditorMouseEvent = editor.IEditorMouseEvent;
import IModelContentChangedEvent = editor.IModelContentChangedEvent;
import IModelLanguageChangedEvent = editor.IModelLanguageChangedEvent;
import IModelLanguageConfigurationChangedEvent = editor.IModelLanguageConfigurationChangedEvent;
import IModelOptionsChangedEvent = editor.IModelOptionsChangedEvent;
import ConfigurationChangedEvent = editor.ConfigurationChangedEvent;
import ICursorPositionChangedEvent = editor.ICursorPositionChangedEvent;
import ICursorSelectionChangedEvent = editor.ICursorSelectionChangedEvent;
import IModelChangedEvent = editor.IModelChangedEvent;
import IModelDecorationsChangedEvent = editor.IModelDecorationsChangedEvent;
import IPasteEvent = editor.IPasteEvent;
import IPartialEditorMouseEvent = editor.IPartialEditorMouseEvent;
import EditorLayoutInfo = editor.EditorLayoutInfo;
import IContentSizeChangedEvent = editor.IContentSizeChangedEvent;
import IEditorAction = editor.IEditorAction;
import ICodeEditorViewState = editor.ICodeEditorViewState;
import ScrollType = editor.ScrollType;
import IMouseTarget = editor.IMouseTarget;
import IEditorContribution = editor.IEditorContribution;
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;
import ICursorStateComputer = editor.ICursorStateComputer;
import ICommand = editor.ICommand;
import {TextModel} from "./model";
import IStandaloneThemeData = editor.IStandaloneThemeData;
import EditorOption = editor.EditorOption;

const Events = require("./EditorEvents.json");


export class Editor {
    private readonly _container: HTMLElement = null
    private _javaEditorProxy: any = null
    private _ready: boolean = false
    private _codeEditor: IStandaloneCodeEditor = null
    private _textModel: TextModel = null
    private _addedActions = {}
    private _addCommands = {}
    private _builtinThemes = ["vs", "vs-dark", "hc-black"]
    private _currentTheme: string | null = this._builtinThemes[0]

    private DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
        language: "javascript",
        lineNumbers: "off",
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: this._currentTheme,
    }

    constructor(container: HTMLElement) {
        this._container = container
    }

    setReady(ready: boolean) {
        this._ready = ready
    }

    isReady() {
        return this._ready
    }

    setJavaEditorProxy(editorProxy) {
        this._javaEditorProxy = editorProxy
    }

    /*******************************事件相关**************************************/
    onActionRun(actionId: number, ...args: any[]) {
        if (this._codeEditor != null && this._javaEditorProxy != null) {
            this._javaEditorProxy.onActionRun(actionId)
        }
    }

    onCommand(commandId: string) {
        if (this._codeEditor != null && this._javaEditorProxy != null) {
            this._javaEditorProxy.onCommand(commandId)
        }
    }

    onEditorEvent(eventId: number, e?: any) {
        if (this._codeEditor != null && this._javaEditorProxy != null) {
            this._javaEditorProxy.onEditorEvent(eventId, (e==undefined)? null : e)
        }
    }
    /************************************************************************/

    private setupEditorEvents(editor: IStandaloneCodeEditor) {
        editor.onDidChangeModelContent((e: IModelContentChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModelContent, e)
        })

        editor.onDidChangeModelLanguage((e: IModelLanguageChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModelLanguage, e)
        })
        /**
         * An event emitted when the language configuration of the current model has changed.
         */
        editor.onDidChangeModelLanguageConfiguration((e: IModelLanguageConfigurationChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModelLanguageConfiguration, e)
        })
        /**
         * An event emitted when the options of the current model has changed.
         */
        editor.onDidChangeModelOptions((e: IModelOptionsChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModelOptions, e)
        })
        /**
         * An event emitted when the configuration of the editor has changed. (e.g. `editor.updateOptions()`)
         */
        editor.onDidChangeConfiguration((e: ConfigurationChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeConfiguration, e)
        })
        /**
         * An event emitted when the cursor position has changed.
         */
        editor.onDidChangeCursorPosition((e: ICursorPositionChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeCursorPosition, e)
        })
        /**
         * An event emitted when the cursor selection has changed.
         */
        editor.onDidChangeCursorSelection((e: ICursorSelectionChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeCursorSelection, e)
        })
        /**
         * An event emitted when the model of this editor has changed (e.g. `editor.setModel()`).
         */
        editor.onDidChangeModel((e: IModelChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModel, e)
        })
        /**
         * An event emitted when the decorations of the current model have changed.
         */
        editor.onDidChangeModelDecorations((e: IModelDecorationsChangedEvent) => {
            this.onEditorEvent(Events.onDidChangeModelDecorations, e)
        })
        /**
         * An event emitted when the text inside this editor gained focus (i.e. cursor starts blinking).
         */
        editor.onDidFocusEditorText(() => {
            this.onEditorEvent(Events.onDidFocusEditorText)
        })
        /**
         * An event emitted when the text inside this editor lost focus (i.e. cursor stops blinking).
         */
        editor.onDidBlurEditorText(() => {
            this.onEditorEvent(Events.onDidBlurEditorText)
        })
        /**
         * An event emitted when the text inside this editor or an editor widget gained focus.
         */
        editor.onDidFocusEditorWidget(() => {
            this.onEditorEvent(Events.onDidFocusEditorWidget)
        })
        /**
         * An event emitted when the text inside this editor or an editor widget lost focus.
         */
        editor.onDidBlurEditorWidget(() => {
            this.onEditorEvent(Events.onDidBlurEditorWidget)
        })
        /**
         * An event emitted after composition has started.
         */
        editor.onDidCompositionStart(() => {
            this.onEditorEvent(Events.onDidCompositionStart)
        })
        /**
         * An event emitted after composition has ended.
         */
        editor.onDidCompositionEnd(() => {
            this.onEditorEvent(Events.onDidCompositionEnd)
        })
        /**
         * An event emitted when editing failed because the editor is read-only.
         */
        editor.onDidAttemptReadOnlyEdit(() => {
            this.onEditorEvent(Events.onDidAttemptReadOnlyEdit)
        })
        /**
         * An event emitted when users paste text in the editor.
         */
        editor.onDidPaste((e: IPasteEvent) => {
            this.onEditorEvent(Events.onDidPaste, e)
        })
        /**
         * An event emitted on a "mouseup".
         */
        editor.onMouseUp((e: IEditorMouseEvent) => {
            this.onEditorEvent(Events.onMouseUp, e)
        })
        /**
         * An event emitted on a "mousedown".
         */
        editor.onMouseDown((e: IEditorMouseEvent) => {
            this.onEditorEvent(Events.onMouseDown, e)
        })
        /**
         * An event emitted on a "contextmenu".
         */
        editor.onContextMenu((e: IEditorMouseEvent) => {
            this.onEditorEvent(Events.onContextMenu, e)
        })
        /**
         * An event emitted on a "mousemove".
         */
        editor.onMouseMove((e: IEditorMouseEvent) => {
            this.onEditorEvent(Events.onMouseMove, e)
        })
        /**
         * An event emitted on a "mouseleave".
         */
        editor.onMouseLeave((e: IPartialEditorMouseEvent) => {
            this.onEditorEvent(Events.onMouseLeave, e)
        })
        /**
         * An event emitted on a "keyup".
         */
        editor.onKeyUp((e: IKeyboardEvent) => {
            this.onEditorEvent(Events.onKeyUp, e)
        })
        /**
         * An event emitted on a "keydown".
         */
        editor.onKeyDown((e: IKeyboardEvent) => {
            this.onEditorEvent(Events.onKeyDown, e)
        })
        /**
         * An event emitted when the layout of the editor has changed.
         */
        editor.onDidLayoutChange((e: EditorLayoutInfo) => {
            this.onEditorEvent(Events.onDidLayoutChange, e)
        })
        /**
         * An event emitted when the content width or content height in the editor has changed.
         */
        editor.onDidContentSizeChange((e: IContentSizeChangedEvent) => {
            this.onEditorEvent(Events.onDidContentSizeChange, e)
        })
        /**
         * An event emitted when the scroll in the editor has changed.
         */
        editor.onDidScrollChange((e: IScrollEvent) => {
            this.onEditorEvent(Events.onDidScrollChange, e)
        })
    }

    /**
     * 创建编辑器实例
     * @param options 选项
     */
    create(options: IStandaloneEditorConstructionOptions = null): boolean {
        if (this._codeEditor != null)
            this._codeEditor.dispose()
        if (options == null) {
            options = this.DEFAULT_OPTIONS
        }

        if (options.language == null) {
            options.language = this.DEFAULT_OPTIONS.language
        }

        this._codeEditor = monaco.editor.create(this._container, options)
        if (this._codeEditor == null)
            return false
        this.setupEditorEvents(this._codeEditor)
        this._textModel = new TextModel(this._codeEditor.getModel())
        this._textModel.currentLanguage = options.language
        this.setReady(true)
        return true
    }

    getTextModel(): TextModel {
        return this._textModel
    }

    setTextModel(model: TextModel|null): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.setModel(model.model)
        this._textModel = model
        return true
    }

    /**
     * 销毁编辑器实例
     */
    dispose(): boolean {
        if (this._codeEditor != null) {
            this.setReady(false)
            this._codeEditor.dispose()
            this._codeEditor = null
            return true
        }
        return false
    }

    /**
     * 自动重新布局编辑器
     */
    autoLayout(): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.layout()
            return true
        }
        return false

    }

    getAction(id: string): IEditorAction | null {
        if (this._codeEditor == null)
            return null
        return this._codeEditor.getAction(id)
    }

    trigger(source: string | null, handlerId: string, payload: any): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.trigger(source, handlerId, payload)
        return true
    }

    setValue(value: string): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.setValue(value)
        return true
    }

    setSelections(selections: ISelection[]): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.setSelections(selections)
        return true
    }

    setSelection(selection: IRange): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.setSelection(selection)
        return true
    }

    saveViewState(): ICodeEditorViewState | null {
        if (this._codeEditor == null)
            return null
        return this._codeEditor.saveViewState()
    }

    restoreViewState(state: ICodeEditorViewState): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.restoreViewState(state)
        return true
    }

    revealRangeNearTopIfOutsideViewport(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRangeNearTopIfOutsideViewport(range, scrollType)
        return true
    }

    revealRangeNearTop(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRangeNearTop(range, scrollType)
        return true
    }

    revealRangeInCenterIfOutsideViewport(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRangeInCenterIfOutsideViewport(range, scrollType)
        return true
    }

    revealRangeInCenter(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRangeInCenter(range, scrollType)
        return true
    }

    revealRangeAtTop(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRangeAtTop(range, scrollType)
        return true
    }

    revealRange(range: IRange, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealRange(range, scrollType)
        return true
    }

    revealPositionNearTop(position: IPosition, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealPositionNearTop(position, scrollType)
        return true
    }

    revealPositionInCenterIfOutsideViewport(position: IPosition, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealPositionInCenterIfOutsideViewport(position, scrollType)
        return true
    }

    revealPositionInCenter(position: IPosition, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealPositionInCenter(position, scrollType)
        return true
    }

    revealPosition(position: IPosition, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealPosition(position, scrollType)
        return true
    }

    revealLinesNearTop(lineNumber: number, endLineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLinesNearTop(lineNumber, endLineNumber, scrollType)
        return true
    }

    revealLinesInCenterIfOutsideViewport(lineNumber: number, endLineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLinesInCenterIfOutsideViewport(lineNumber, endLineNumber, scrollType)
        return true
    }

    revealLinesInCenter(lineNumber: number, endLineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLinesInCenter(lineNumber, endLineNumber, scrollType)
        return true
    }

    revealLines(lineNumber: number, endLineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLines(lineNumber, endLineNumber, scrollType)
        return true
    }

    revealLineNearTop(lineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLineNearTop(lineNumber, scrollType)
        return true
    }

    revealLineInCenterIfOutsideViewport(lineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLineInCenterIfOutsideViewport(lineNumber, scrollType)
        return true
    }

    revealLine(lineNumber: number, scrollType?: ScrollType) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.revealLine(lineNumber, scrollType)
        return true
    }

    render(forceRedraw?: boolean) {
        if (this._codeEditor == null)
            return false
        this._codeEditor.render(forceRedraw)
        return true
    }

    pushUndoStop(): boolean {
        if (this._codeEditor == null)
            return false
        return this._codeEditor.pushUndoStop()
    }

    popUndoStop(): boolean {
        if (this._codeEditor == null)
            return false
        return this._codeEditor.popUndoStop()
    }

    hasWidgetFocus(): boolean {
        if (this._codeEditor == null)
            return false
        return this._codeEditor.hasWidgetFocus()
    }

    hasTextFocus(): boolean {
        if (this._codeEditor == null)
            return false
        return this._codeEditor.hasTextFocus()
    }

    getVisibleRanges(): IRange[] | null {
        if (this._codeEditor == null)
            return null
        return this._codeEditor.getVisibleRanges()
    }

    getVisibleColumnFromPosition(position: IPosition): number | null {
        if (this._codeEditor == null)
            return null
        return this._codeEditor.getVisibleColumnFromPosition(position)
    }


    /**
     * 添加一个Action
     * @param descriptor
     */
    addAction(descriptor: any):boolean {
        if (this._codeEditor != null) {
            let _this = this
            let actualDescriptor: IActionDescriptor = {
                id: descriptor.id,
                label: descriptor.label,
                run(editor: editor.ICodeEditor, ...args: any[]): void {
                    _this.onActionRun(this.id, args)
                }
            }

            if ("precondition" in descriptor)
                actualDescriptor.precondition = descriptor.precondition
            if ("keybindings" in descriptor)
                actualDescriptor.keybindings = descriptor.keybindings
            if ("keybindingContext" in descriptor)
                actualDescriptor.keybindingContext = descriptor.keybindingContext
            if ("contextMenuGroupId" in descriptor)
                actualDescriptor.contextMenuGroupId = descriptor.contextMenuGroupId
            if ("contextMenuOrder" in descriptor)
                actualDescriptor.contextMenuOrder = descriptor.contextMenuOrder

            let action = this._codeEditor.addAction(actualDescriptor)

            if (action != null) {
                this._addedActions[descriptor.id] = action
                return true
            } else {
                return false
            }
        }
        return false
    }

    /**
     * 移除一个Action
     * @param actionId
     */
    removeAction(actionId: string):boolean {
        if (this._codeEditor != null && actionId in this._addedActions) {
            let action = this._addedActions[actionId]
            action.dispose()
            delete this._addedActions[actionId]
            return true
        }
        return false
    }

    /**
     * 添加一个command
     * @param keybinding
     * @param commandHandlerId
     * @param context
     */
    addCommand(keybinding: number, commandHandlerId: string, context?: string):boolean {
        if (this._codeEditor != null) {
            let _this = this
            let commandId = this._codeEditor.addCommand(keybinding, function (...args: any[]) {
                _this.onCommand(commandId)
            }, context)

            if (commandId != null) {
                this._addCommands[commandHandlerId] = commandId
                return true
            }
            else
                return false
        }
        return false
    }

    updateOptions(options: IStandaloneEditorConstructionOptions): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.updateOptions(options)
            return true
        }
        return false

    }

    getRawEditor() {
        return this._codeEditor
    }


    setText(text): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.setValue(text)
            return true
        }
        return false
    }

    getText():string|null {
        if (this._codeEditor != null)
            return this._codeEditor.getValue()
        return null
    }

    focus():boolean {
        if (this._codeEditor != null) {
            this._codeEditor.focus()
            return true
        }
        return false
    }

    getOptions(): string|null {
        if (this._codeEditor != null)
            return JSON.stringify(this._codeEditor.getOptions())
        else
            return null
    }

    getOption(id: number): string|null {
        if (this._codeEditor != null) {
            return JSON.stringify(this._codeEditor.getOption(id))
        }
        return null
    }

    getCurrentLanguage(): string|null {
        if (this._codeEditor != null)
            return this._textModel.currentLanguage
        return null
    }
    setCurrentLanguage(lang: string): boolean {
        if (this._codeEditor != null) {
            monaco.editor.setModelLanguage(this._codeEditor.getModel(), lang)
            return true
        }
        return false
    }

    getLanguages(): string|null {
        if (this._codeEditor != null) {
            return JSON.stringify(monaco.languages.getLanguages())
        }
        return null
    }

    setScrollLeft(newScrollLeft: number, scrollType?: number): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.setScrollLeft(newScrollLeft, scrollType)
            return true
        }
        return false
    }

    setScrollTop(newScrollTop: number, scrollType?: number): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.setScrollTop(newScrollTop, scrollType)
            return true
        }
        return false
    }

    setScrollPosition(position: INewScrollPosition, scrollType?: number): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.setScrollPosition(position, scrollType)
            return true
        }
        return false
    }

    setScrollPositionXY(positionLeft: number, positionTop: number, scrollType?: number): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.setScrollPosition({scrollLeft: positionLeft, scrollTop: positionTop}, scrollType)
            return true
        }
        return false
    }

    getTopForPosition(lineNumber: number, column: number): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getTopForPosition(lineNumber, column)
    }

    getTopForLineNumber(lineNumber: number): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getTopForLineNumber(lineNumber)
    }

    getTargetAtClientPoint(clientX: number, clientY: number): IMouseTarget | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getTargetAtClientPoint(clientX, clientY)
    }

    getSupportedActions(clientX: number, clientY: number): IEditorAction[] | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSupportedActions()
    }

    getSelections(): ISelection[] | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSelections()
    }

    getSelection(): ISelection | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSelection()
    }

    getScrolledVisiblePosition(position: IPosition): {
        top: number;
        left: number;
        height: number;
    }  | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getScrolledVisiblePosition(position)
    }

    getScrollWidth(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getScrollWidth()
    }

    getScrollTop(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getScrollTop()
    }

    getScrollLeft(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getScrollLeft()
    }

    getScrollHeight(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getScrollHeight()
    }

    getPosition(): IPosition | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getPosition()
    }

    getOffsetForColumn(lineNumber: number, column: number): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getOffsetForColumn(lineNumber, column)
    }

    getLayoutInfo(): EditorLayoutInfo | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getLayoutInfo()
    }

    getContribution(id: string): IEditorContribution | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getContribution(id)
    }

    getContentWidth(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getContentWidth()
    }

    getContentHeight(): number | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getContentHeight()
    }

    executeEdits(source: string | null | undefined, edits: IIdentifiedSingleEditOperation[], endCursorState?: ICursorStateComputer | Selection[]): boolean | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.executeEdits(source, edits, endCursorState)
    }

    executeCommands(source: string, commands: ICommand[]): boolean | null {
        if (this._codeEditor == null) {
            return null
        }
        this._codeEditor.executeCommands(source, commands)
        return true
    }

    executeCommand(source: string, command: ICommand): boolean | null {
        if (this._codeEditor == null) {
            return null
        }
        this._codeEditor.executeCommand(source, command)
        return true
    }

    setTheme(themeName: string): boolean {
        if (this._codeEditor == null)
            return false
        //this._codeEditor.updateOptions({theme: themeName})
        monaco.editor.setTheme(themeName)
        this._currentTheme = themeName
        return true
    }

    getTheme(): string | null {
        if (this._codeEditor == null)
            return null
        return this._currentTheme
    }

    getBuiltinThemes(): string[] | null {
        if (this._codeEditor == null)
            return null
        return this._builtinThemes
    }

    defineTheme(themeName: String, themeData: IStandaloneThemeData): boolean | null {
        return null
    }

    
}