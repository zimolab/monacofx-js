import * as monaco from "monaco-editor"
import {
    editor,
    IPosition, IRange,
    ISelection, Selection
} from "monaco-editor"
import EndOfLinePreference = editor.EndOfLinePreference
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions
import INewScrollPosition = editor.INewScrollPosition
import IActionDescriptor = editor.IActionDescriptor
import EditorLayoutInfo = editor.EditorLayoutInfo;
import IEditorAction = editor.IEditorAction;
import ICodeEditorViewState = editor.ICodeEditorViewState;
import ScrollType = editor.ScrollType;
import IMouseTarget = editor.IMouseTarget;
import IEditorContribution = editor.IEditorContribution;
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;
import ICursorStateComputer = editor.ICursorStateComputer;
import ICommand = editor.ICommand;
import { TextModel } from "./model";
import IStandaloneThemeData = editor.IStandaloneThemeData;
import { EditorEventBridge, EventBridge, EventCallback } from "./EventBridge"
import { doClipboardFixForFx, SystemClipboard } from "./clipboard-fix"
import { Utils } from "./utils"

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
    private _eventBridge: EventBridge | null = null
    private readonly _eventCallback: EventCallback = (eventId: number, event?: any | null) => {
        if (this._javaEditorProxy != null) {
            this._javaEditorProxy.onEditorEvent(eventId, event)
        }
    }

    private DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
        language: "javascript",
        lineNumbers: "on",
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: this._currentTheme,
        value: ""
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

    setJavaEditorProxy(editorProxy: any) {
        this._javaEditorProxy = editorProxy
    }

    /*******************************????????????**************************************/
    onActionRun(actionId: number, ..._args: any[]) {
        if (this._codeEditor != null && this._javaEditorProxy != null) {
            this._javaEditorProxy.onActionRun(actionId)
        }
    }

    onCommand(commandId: string) {
        if (this._codeEditor != null && this._javaEditorProxy != null) {
            this._javaEditorProxy.onCommand(commandId)
        }
    }

    listen(eventId: number): boolean {
        if (this._eventBridge == null || this._codeEditor == null) {
            return false
        }
        try {
            this._eventBridge.listen(eventId, this._eventCallback)
        } catch (e) {
            console.error((e as Error).message)
            return false
        }
        return true
    }

    unlisten(eventId: number): boolean {
        if (this._eventBridge == null || this._codeEditor == null)
            return false
        this._eventBridge.unlisten(eventId)
        return true
    }

    isListened(eventId: number): boolean {
        if (this._eventBridge == null || this._codeEditor == null)
            return false
        return this._eventBridge.isListened(eventId)
    }


    /**
     * ?????????????????????
     * @param options ??????
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
        this._eventBridge = new EditorEventBridge(this._codeEditor)
        this._textModel = new TextModel(this._codeEditor.getModel())
        this._textModel.currentLanguage = options.language
        doClipboardFixForFx(this)
        this.setReady(true)
        return true
    }

    getTextModel(): TextModel {
        return this._textModel
    }

    setTextModel(model: TextModel | null): boolean {
        if (this._codeEditor == null)
            return false
        this._codeEditor.setModel(model.model)
        this._textModel = model
        return true
    }

    //TODO: API
    getCurrentLineNumber(): number | null {
        return this.getPosition().lineNumber
    }

    //TODO: API
    getCurrentLineContent(): string | null {
        return this._textModel?.getLineContent(this.getCurrentLineNumber())
    }

    //TODO: API
    getSelectedContent(
        lineContentForEmptySelection: boolean = false,
        eol?: EndOfLinePreference): Array<string> | null {
        let selections = this.getSelections()
        return selections != null ? this._textModel?.getContentInSelections(selections, lineContentForEmptySelection, eol) : null
    }

    //TODO: API
    deleteLineAt(lineNumber: number, computeAfterCursorPosition: boolean = true): string | null {
        if (this._textModel == null || lineNumber > this._textModel.getLineCount() || lineNumber < 1)
            return null
        this.focus()
        let content = this._textModel.getLineContent(lineNumber)
        let afterCursorPosition = computeAfterCursorPosition ? Utils.computeCursorForDeleteLineEdit(lineNumber, 1) : undefined
        let edit = Utils.newDeleteLineEdit(lineNumber, 1)
        if (computeAfterCursorPosition) {
            this.executeEdits("", [edit], [afterCursorPosition])
        } else {
            this.executeEdits("", [edit])
        }
        this.focus()
        return content
    }

    // TODO: API
    deleteSelectedContent(
        deleteLineForEmptySelection: boolean = false,
        computeAfterCursorPosition: boolean = true,
        eol?: EndOfLinePreference): string[] | null {
        if (this._textModel == null)
            return null
        this.focus()
        let selections = this.getSelections()
        let content = this.getSelectedContent(deleteLineForEmptySelection, eol)
        let edits = Utils.newDeleteEdits(selections, deleteLineForEmptySelection)
        if (computeAfterCursorPosition) {
            let afterCursorPositions = Utils.computeCursorForDeleteEdits(selections, deleteLineForEmptySelection)
            this.executeEdits("", edits, afterCursorPositions.length > 0 ? afterCursorPositions : undefined)
        } else {
            this.executeEdits("", edits)
        }
        this.focus()
        return content
    }

    // TODO: API
    insertContentAtPosition(
        position: IPosition,
        content: string,
        computeAfterCursorPosition: boolean = true): boolean {
        if (this._textModel == null)
            return false
        this.focus()
        let edit = Utils.newInsertAtPositionEdit(position, content)
        let result: boolean = false
        if (computeAfterCursorPosition) {
            let afterCursorPosition = Utils.computeCursorForInsertAtPositionEdit(position, content)
            result = this.executeEdits("", [edit], [afterCursorPosition])
        } else {
            result = this.executeEdits("", [edit])
        }
        this.focus()
        return result
    }

    // TODO: API
    insertContentAtCurrentPosition(content: string, computeAfterCursorPosition: boolean = true): boolean {
        return this.insertContentAtPosition(this.getPosition(), content, computeAfterCursorPosition)
    }

    // TODO: API
    insertContentAtSelection(
        selection: ISelection,
        content: string,
        computeAfterCursorPosition: boolean = true): boolean {
        if (this._textModel == null)
            return false
        let edit = Utils.newInsertAtSelectionEdit(selection, content)
        return this.executeEdits("", [edit])
    }

    // TODO: API
    insertContentAtSelections(
        selections: ISelection[],
        content: string,
        computeAfterCursorPosition: boolean = true): boolean {
        if (this._textModel == null)
            return false
        let edits = Utils.newInsertAtSelectionEdits(selections, content)
        return this.executeEdits("", edits)
    }

    // clipboard fix
    // TODO: API
    copy(): boolean {
        let contetnt = this.getSelectedContent(true)?.join(this._textModel.getEOL())
        if (contetnt != null) {
            SystemClipboard.setContent(contetnt)
            return true
        } else {
            return false
        }
    }

    // TODO: API
    cut() {
        let content = this.deleteSelectedContent(true, true)?.join(this._textModel.getEOL())
        if (content != null) {
            SystemClipboard.setContent(content)
            return true
        }
        return false
    }

    paste(): boolean {
        let selections = this.getSelections()
        let content = SystemClipboard.getContent()
        if (selections == null || content == null)
            return false
        selections.forEach((s)=>{
            this.executeEdits("", [Utils.newInsertAtSelectionEdit(s, content)])
        })
    }
    // ~clipboard fix

    /**
     * ?????????????????????
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
     * ???????????????????????????
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
     * ????????????Action
     * @param descriptor
     */
    addAction(descriptor: any): boolean {
        if (this._codeEditor != null) {
            let _this = this
            let actualDescriptor: IActionDescriptor = {
                id: descriptor.id,
                label: descriptor.label,
                run(_editor: editor.ICodeEditor, ...args: any[]): void {
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
     * ????????????Action
     * @param actionId
     */
    removeAction(actionId: string): boolean {
        if (this._codeEditor != null && actionId in this._addedActions) {
            let action = this._addedActions[actionId]
            action.dispose()
            delete this._addedActions[actionId]
            return true
        }
        return false
    }

    /**
     * ????????????command
     * @param keybinding
     * @param commandHandlerId
     * @param context
     */
    addCommand(keybinding: number, commandHandlerId: string, context?: string): boolean {
        if (this._codeEditor != null) {
            let _this = this
            let commandId = this._codeEditor.addCommand(keybinding, function () {
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

    getText(): string | null {
        if (this._codeEditor != null)
            return this._codeEditor.getValue()
        return null
    }

    focus(): boolean {
        if (this._codeEditor != null) {
            this._codeEditor.focus()
            return true
        }
        return false
    }

    getOptions(): string | null {
        if (this._codeEditor != null)
            return JSON.stringify(this._codeEditor.getOptions())
        else
            return null
    }

    getOption(id: number): string | null {
        if (this._codeEditor != null) {
            return JSON.stringify(this._codeEditor.getOption(id))
        }
        return null
    }

    getCurrentLanguage(): string | null {
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

    getLanguages(): string | null {
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
            this._codeEditor.setScrollPosition({ scrollLeft: positionLeft, scrollTop: positionTop }, scrollType)
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

    getSupportedActions(): IEditorAction[] | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSupportedActions()
    }

    getSelections(): Selection[] | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSelections()
    }

    getSelection(): Selection | null {
        if (this._codeEditor == null) {
            return null
        }
        return this._codeEditor.getSelection()
    }

    getScrolledVisiblePosition(position: IPosition): {
        top: number;
        left: number;
        height: number;
    } | null {
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

    defineTheme(themeName: string, themeData: IStandaloneThemeData): boolean | null {
        if (this._codeEditor == null)
            return null
        monaco.editor.defineTheme(themeName, themeData)
        return true
    }

}