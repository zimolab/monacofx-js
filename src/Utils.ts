import * as monaco from "monaco-editor"
import { editor, IPosition, IRange, ISelection, Selection } from "monaco-editor"
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation


export class Utils {
    static selection2Range(selection: ISelection): IRange {
        return {
            startLineNumber: selection.selectionStartLineNumber,
            startColumn: selection.selectionStartColumn,
            endLineNumber: selection.positionLineNumber,
            endColumn: selection.positionColumn
        }
    }

    static range2Selection(range: IRange): ISelection {
        return {
            selectionStartLineNumber: range.startLineNumber,
            selectionStartColumn: range.startColumn,
            positionLineNumber: range.endLineNumber,
            positionColumn: range.endColumn
        }
    }

    static selections2Ranges(selections: ISelection[]): IRange[] {
        let ranges = new Array<IRange>()
        selections.forEach((selection) => {
            ranges.push(this.selection2Range(selection))
        })
        return ranges
    }

    static ranges2Selections(ranges: IRange[]): ISelection[] {
        let selections = new Array<ISelection>()
        ranges.forEach((range) => {
            selections.push(this.range2Selection(range))
        })
        return selections
    }

    static isEmptySelection(selection: ISelection): boolean {
        return (selection.selectionStartLineNumber == selection.positionLineNumber) && (selection.selectionStartColumn == selection.positionColumn)

    }

    static isEmptyRange(range: IRange): boolean {
        return (range.startLineNumber == range.endLineNumber) && (range.startColumn == range.endColumn)

    }


    static newDeleteEdit(selection: ISelection, processEmptySelection: boolean = false): IIdentifiedSingleEditOperation {
        if (this.isEmptySelection(selection)) {
            if (processEmptySelection) {
                return {
                    text: "",
                    range: {
                        startLineNumber: selection.selectionStartLineNumber,
                        startColumn: 1,
                        endLineNumber: selection.selectionStartLineNumber + 1,
                        endColumn: 1
                    },
                    forceMoveMarkers: true
                }
            } else {
                return null
            }
        } else {
            return {
                text: "",
                range: this.selection2Range(selection),
                forceMoveMarkers: true
            }
        }
    }

    static newDeleteEdits(selections: ISelection[], processEmptySelection: boolean = false): IIdentifiedSingleEditOperation[] {
        let edits = new Array<IIdentifiedSingleEditOperation>()
        selections.forEach((s) => {
            let edit = this.newDeleteEdit(s, processEmptySelection)
            if (edit != null)
                edits.push(edit)
        })
        return edits
    }

    static newDeleteLineEdit(lineNumber: number, column: number): IIdentifiedSingleEditOperation {
        return this.newDeleteEdit(this.emptySelection(lineNumber, column), true)
    }

    static newInsertAtPositionEdit(position: IPosition, content: string): IIdentifiedSingleEditOperation {
        return {
            text: content,
            range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            },
            forceMoveMarkers: true
        }
    }

    static newInsertAtSelectionEdit(selection: ISelection, content: string): IIdentifiedSingleEditOperation {
        return {
            text: content,
            range: {
                startLineNumber: selection.selectionStartLineNumber,
                startColumn: selection.selectionStartColumn,
                endLineNumber: selection.positionLineNumber,
                endColumn: selection.positionColumn
            },
            forceMoveMarkers: true
        }
    }

    static newInsertAtSelectionEdits(selections: ISelection[], content: string): IIdentifiedSingleEditOperation[] {
        let edits = new Array<IIdentifiedSingleEditOperation>()
        selections.forEach((s) => {
            edits.push(this.newInsertAtSelectionEdit(s, content))
        })
        return edits
    }

    static computeCursorForInsertAtPositionEdit(position: IPosition, content: string): Selection {
        return new Selection(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column + content.length
        )
    }

    // static computeCursorForInsertAtSelectionEdit(selection: ISelection, content: string): Selection {

    // }


    static computeCursorForDeleteEdit(range: IRange, processEmptyRange: boolean = false): Selection | null {
        if (this.isEmptyRange(range)) {
            if (processEmptyRange) {
                return new Selection(
                    range.startLineNumber,
                    1,
                    range.startLineNumber,
                    1
                )
            } else {
                return null
            }
        } else {
            return new Selection(
                range.startLineNumber,
                range.startColumn,
                range.startLineNumber,
                range.startColumn
            )
        }
    }

    static computeCursorForDeleteEdits(ranges: IRange[], processEmptyRange: boolean = false): Selection[] {
        let newCursorPositions = new Array<Selection>()
        ranges.forEach((range) => {
            let newCursorPosition = this.computeCursorForDeleteEdit(range, processEmptyRange)
            if (newCursorPosition != null) {
                newCursorPositions.push(newCursorPosition)
            }
        })
        return newCursorPositions
    }

    static computeCursorForDeleteLineEdit(lineNumber: number, column: number): Selection | null {
        return this.computeCursorForDeleteEdit(this.emptyRange(lineNumber, column), true)
    }

    static emptyRange(lineNumber: number, column: number): IRange {
        return {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column
        }
    }

    static emptySelection(lineNumber: number, column: number): ISelection {
        return {
            selectionStartLineNumber: lineNumber,
            selectionStartColumn: column,
            positionLineNumber: lineNumber,
            positionColumn: column
        }
    }
}

// window.fireHostEnvReadyEvent();e=ME.editor;e.create();e.setText("1\r\n123\r\n12345");e.focus();e.deleteLine(3);