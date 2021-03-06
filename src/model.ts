import {
    editor,
    IPosition,
    IRange,
    ISelection,
    Position,
    Range,
    Selection,
    Uri
} from "monaco-editor";
import { TextModelEventBridge } from "./EventBridge";
import IModel = editor.ITextModel;
import TextModelResolvedOptions = editor.TextModelResolvedOptions;
import EndOfLinePreference = editor.EndOfLinePreference;
import EndOfLineSequence = editor.EndOfLineSequence;
import IWordAtPosition = editor.IWordAtPosition;
import ITextModelUpdateOptions = editor.ITextModelUpdateOptions;
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;
import ICursorStateComputer = editor.ICursorStateComputer;
import IValidEditOperation = editor.IValidEditOperation;
import FindMatch = editor.FindMatch;
import { Utils } from "./utils";


export class TextModel {
    private _javaTextModelProxy = null
    private _model: IModel | null = null
    private _currentLanguage: string = ""
    private _eventBridge: TextModelEventBridge | null = null
    private _eventCallback = (eventId: number, event?: any | null) => {
        if (this._javaTextModelProxy != null) {
            this._javaTextModelProxy.onTextModelEvent(eventId, event)
        }
    }

    get model(): editor.IModel | null {
        return this._model
    }

    get currentLanguage(): string {
        return this._currentLanguage
    }

    set currentLanguage(lang: string) {
        this._currentLanguage = lang
    }

    constructor(model: IModel) {
        this._model = model
    }

    // 此方法在kotlin中被调用
    onReady(javaTextModelProxy: any) {
        this._javaTextModelProxy = javaTextModelProxy
        this._eventBridge = new TextModelEventBridge(this._model)
    }

    ////////////////////////与Kotlin进行事件桥接/////////////////////////////////
    onTextModelEvent(eventId: number, event: any | null) {
        if (this._javaTextModelProxy != null) {
            this._javaTextModelProxy.onTextModelEvent(eventId, event)
        }
    }

    listen(eventId: number): boolean {
        if (this._eventBridge == null || this._model == null) {
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
        if (this._eventBridge == null || this._model == null)
            return false
        this._eventBridge.unlisten(eventId)
        return true
    }

    isListened(eventId: number): boolean {
        if (this._eventBridge == null || this._model == null)
            return false
        return this._eventBridge.isListened(eventId)
    }


    ///////////////////////////////////////////////////////////////////////////


    /////////////////////////////////APIs///////////////////////////////////////
    // TODO: 创建新TextModel
    static create() {
    }

    uri(): Uri {
        return this._model.uri
    }

    id(): string {
        return this._model.id
    }

    /**
     * 销毁内部IModel实例
     * @returns
     */
    dispose(): boolean {
        if (this._model == null)
            return false
        this._model.dispose()
        this._model = null
        return true
    }

    /**
     * IModel实例是否被销毁
     */
    isDisposed(): boolean | null {
        if (this._model == null)
            return null
        return this._model.isDisposed()
    }

    /**
     * 获取IModel实例的配置项
     * @returns 
     */
    getOptions(): TextModelResolvedOptions | null {
        if (this._model == null)
            return null
        return this._model.getOptions()
    }

    /**
     *
     */
    getVersionId(): number | null {
        if (this._model == null)
            return null
        return this._model.getVersionId()
    }


    /**
     *
     */
    getAlternativeVersionId(): number | null {
        if (this._model == null)
            return null
        return this._model.getAlternativeVersionId()
    }

    /**
     *
     */
    setValue(str: string): boolean {
        if (this._model == null)
            return false
        this._model.setValue(str)
        return true
    }

    /**
     *
     */
    getValue(eol: EndOfLinePreference, preserveBOM: boolean): string | null {
        if (this._model == null)
            return null
        return this._model.getValue(eol, preserveBOM)
    }

    getValueLength(eol?: EndOfLinePreference, preserveBOM?: boolean): number | null {
        if (this._model == null)
            return null
        return this._model.getValueLength(eol, preserveBOM)
    }

    getValueInRange(range: IRange, eol?: EndOfLinePreference): string | null {
        if (this._model == null)
            return null
        return this._model.getValueInRange(range, eol)
    }

    getValueLengthInRange(range: IRange): number | null {
        if (this._model == null)
            return null
        return this._model.getValueLengthInRange(range)
    }

    getCharacterCountInRange(range: IRange): number | null {
        if (this._model == null)
            return null
        return this._model.getCharacterCountInRange(range)
    }

    getLineCount(): number | null {
        if (this._model == null)
            return null
        return this._model.getLineCount()
    }

    getLineContent(lineNumber: number): string | null {
        if (this._model == null)
            return null
        return this._model.getLineContent(lineNumber)
    }

    getLineLength(lineNumber: number): number | null {
        if (this._model == null)
            return null
        return this._model.getLineLength(lineNumber)
    }

    getLinesContent(): string[] | null {
        if (this._model == null)
            return null
        return this._model.getLinesContent()
    }

    getEOL(): string | null {
        if (this._model == null)
            return null
        return this._model.getEOL()
    }

    getEndOfLineSequence(): EndOfLineSequence | null {
        if (this._model == null)
            return null
        return this._model.getEndOfLineSequence()
    }

    getLineMinColumn(lineNumber: number): number | null {
        if (this._model == null)
            return null
        return this._model.getLineMinColumn(lineNumber)
    }

    getLineMaxColumn(lineNumber: number): number | null {
        if (this._model == null)
            return null
        return this._model.getLineMaxColumn(lineNumber)
    }

    getLineFirstNonWhitespaceColumn(lineNumber: number): number | null {
        if (this._model == null)
            return null
        return this._model.getLineFirstNonWhitespaceColumn(lineNumber)
    }

    getLineLastNonWhitespaceColumn(lineNumber: number): number | null {
        if (this._model == null)
            return null
        return this._model.getLineLastNonWhitespaceColumn(lineNumber)
    }

    validatePosition(position: IPosition): Position | null {
        if (this._model == null)
            return null
        return this._model.validatePosition(position)
    }

    modifyPosition(position: IPosition, offset: number): Position | null {
        if (this._model == null)
            return null
        return this._model.modifyPosition(position, offset)
    }

    validateRange(range: IRange): Range | null {
        if (this._model == null)
            return null
        return this._model.validateRange(range)
    }

    getOffsetAt(position: IPosition): number | null {
        if (this._model == null)
            return null
        return this._model.getOffsetAt(position)
    }

    getPositionAt(offset: number): Position | null {
        if (this._model == null)
            return null
        return this._model.getPositionAt(offset)
    }

    getFullModelRange(): Range | null {
        if (this._model == null)
            return null
        return this._model.getFullModelRange()
    }

    getWordAtPosition(position: IPosition): IWordAtPosition | null {
        if (this._model == null)
            return null
        return this._model.getWordAtPosition(position)
    }

    getWordUntilPosition(position: IPosition): IWordAtPosition | null {
        if (this._model == null)
            return null
        return this._model.getWordUntilPosition(position)
    }

    normalizeIndentation(str: string): string | null {
        if (this._model == null)
            return null
        return this._model.normalizeIndentation(str)
    }

    updateOptions(newOpts: ITextModelUpdateOptions): boolean {
        if (this._model == null)
            return false
        this._model.updateOptions(newOpts)
        return true
    }


    detectIndentation(defaultInsertSpaces: boolean, defaultTabSize: number): boolean {
        if (this._model == null)
            return false
        this._model.detectIndentation(defaultInsertSpaces, defaultTabSize)
        return true
    }


    pushStackElement(): boolean {
        if (this._model == null)
            return false
        this._model.pushStackElement()
        return true
    }


    popStackElement(): boolean {
        if (this._model == null)
            return false
        this._model.popStackElement()
        return true
    }

    pushEditOperations(beforeCursorState: Selection[] | null,
        editOperations: IIdentifiedSingleEditOperation[],
        cursorStateComputer: ICursorStateComputer): Selection[] | null {
        if (this._model == null)
            return null
        return this._model.pushEditOperations(beforeCursorState, editOperations, cursorStateComputer)
    }

    pushEOL(eol: EndOfLineSequence): boolean {
        if (this._model == null)
            return false
        this._model.pushEOL(eol)
        return true
    }

    applyEdits(operations: IIdentifiedSingleEditOperation[], computeUndoEdits: boolean): IValidEditOperation[] | null {
        if (this._model == null)
            return null
        if (computeUndoEdits) {
            return this._model.applyEdits(operations, true)
        } else {
            this._model.applyEdits(operations, false)
            return null
        }
    }

    setEOL(eol: EndOfLineSequence): boolean {
        if (this._model == null)
            return false
        this._model.setEOL(eol)
        return true
    }


    findMatches(searchString: string,
        searchScope: IRange | IRange[],
        isRegex: boolean,
        matchCase: boolean,
        wordSeparators: string | null,
        captureMatches: boolean,
        searchOnlyEditableRange?: boolean,
        limitResultCount?: number): FindMatch[] | null {
        if (this._model == null)
            return null
        if (searchOnlyEditableRange == undefined) {
            return this._model.findMatches(searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount)
        } else {
            return this._model.findMatches(searchString, searchOnlyEditableRange, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount)
        }
    }

    findNextMatch(searchString: string,
        searchStart: IPosition,
        isRegex: boolean,
        matchCase: boolean,
        wordSeparators: string | null,
        captureMatches: boolean): FindMatch | null {
        if (this._model == null)
            return null
        return this._model.findNextMatch(searchString, searchStart, isRegex, matchCase, wordSeparators, captureMatches)
    }

    findPreviousMatch(searchString: string,
        searchStart: IPosition,
        isRegex: boolean,
        matchCase: boolean,
        wordSeparators: string | null,
        captureMatches: boolean): FindMatch | null {
        if (this._model == null)
            return null
        return this._model.findPreviousMatch(searchString, searchStart, isRegex, matchCase, wordSeparators, captureMatches)
    }

    //////////////////////////////////////////////////////////////////////////

    //////////////////////////////扩展API/////////////////////////////////////
    //TODO: API
    getContentInRange(range: IRange,
        lineContentForEmptyRange: boolean = false,
        eol?: EndOfLinePreference): string | null {

        if (!Utils.isEmptyRange(range)) {
            return this.getValueInRange(range, eol)
        } else {
            if (lineContentForEmptyRange) {
                return this.getLineContent(range.endLineNumber)
            } else {
                return null
            }
        }
    }

    //TODO: API
    getContentInRanges(
        ranges: IRange[],
        lineContentForEmptyRange: boolean = false,
        eol?: EndOfLinePreference): Array<string> {
        let result = new Array<string>()
        ranges.forEach((currentRange) => {

            let selected = this.getContentInRange(currentRange, lineContentForEmptyRange, eol)
            if (selected != null) {
                result.push(selected)
            }
        })
        return result
    }

    //TODO: API
    getContentInSelection(
        selection: ISelection,
        lineContentForEmptySelection: boolean = false,
        eol?: EndOfLinePreference): string | null {

        return this.getContentInRange(Utils.selection2Range(selection), lineContentForEmptySelection, eol)
    }

    //TODO: API
    getContentInSelections(
        selections: ISelection[],
        lineContentForEmptySelection: boolean = false,
        eol?: EndOfLinePreference): Array<string> {

        let result = new Array<string>()
        selections.forEach((selection) => {
            let content = this.getContentInSelection(selection, lineContentForEmptySelection, eol)
            if (content != null)
                result.push(content)
        })
        return result
    }

    //TODO: API
    deleteLineAt(lineNumber: number, beforeCursorPositions: Selection[] = null, computeAfterCursorPosition: boolean = true): string | null {
        if (this._model == null || lineNumber > this.getLineCount() || lineNumber < 1)
            return null
        let content = this.getLineContent(lineNumber)
        let afterCursorPosition = Utils.computeCursorForDeleteLineEdit(lineNumber, 1)
        let edit = Utils.newDeleteLineEdit(lineNumber, 1)
        this.pushEditOperations(beforeCursorPositions, [edit], () => {
            return computeAfterCursorPosition ? [afterCursorPosition] : null
        })
        return content
    }

    //TODO: API
    deleteContentInSelection(
        selections: Selection[],
        deleteLineForEmptySelection: boolean = false,
        computeAfterCursorPosition: boolean = true,
        eol?: EndOfLinePreference): string[] | null {

        if (this._model == null)
            return null
        let content = this.getContentInSelections(selections, deleteLineForEmptySelection, eol)
        let afterCursorPositions = Utils.computeCursorForDeleteEdits(Utils.selections2Ranges(selections), deleteLineForEmptySelection)
        let edits = Utils.newDeleteEdits(selections, deleteLineForEmptySelection)
        this.pushEditOperations(selections, edits, ()=>{
            return computeAfterCursorPosition? afterCursorPositions : null
        })
        return content
    }
}