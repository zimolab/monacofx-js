import * as actions from "monaco-editor/esm/vs/platform/actions/common/actions"
import * as monaco from "monaco-editor"



var _allMenuItems = actions.MenuRegistry._menuItems

export class MenuUtils {
    static getAllMenus() {
        return _allMenuItems
    }
    
    static getMenuTypes() {
        if(_allMenuItems == null)
            return null
        let menuTypes = []
        _allMenuItems.forEach((_, menuId) => {
            menuTypes.push(menuId._debugName)
        });
        return menuTypes
    }
    
    static getMenu(menuType) {
        return _allMenuItems!= null? 
            [..._allMenuItems].find( e=>e[0]._debugName == menuType):
            null
    }
    
    static getMenuId(menuType) {
        let menu = this.getMenu(menuType)
        return menu != null? menu[0] : null
    }
    
    static getMenuItems(menuType) {
        let menu = this.getMenu(menuType)
        return menu != null? menu[1]: null
    }
    
    static getMenuIds(menuType) {
        let menuItems = this.getMenuItems(menuType)
        return menuItems != null? 
            [...menuItems].map(e => e.command?.id):
            null
    }

    static findMenuItemById(menuType, commandId) {
        let menuItems = this.getMenuItems(menuType)
        if(menuItems == null)
            return null
        let node = menuItems._first
        let result = null
        do {
            let command = node?.element?.command
            if(command != null && command?.id == commandId) {
                result = node.element
                break
            }
        } while((node = node.next))
        return result
    }

    static findMenuItemByTitle(menuType, title) {
        let menuItems = this.getMenuItems(menuType)
        if(menuItems == null)
            return null
        let node = menuItems._first
        let result = null
        do {
            let command = node?.element?.command
            if(command != null && command?.title == title) {
                result = node.element
                break
            }
        } while((node = node.next))
        return result
    }

    static findMenuItemsByGroup(menuType, groupName) {
        let menuItems = this.getMenuItems(menuType)
        if(menuItems == null)
            return null
        let node = menuItems._first
        let result = []
        do {
            let group = node?.element?.group
            if(group == groupName) {
                result.push(node.element)
            }
        } while((node = node.next))
        return result
    }

    static removeMenuItemById(menuType, ids) {
        let menuItems = this.getMenuItems(menuType)
        if(menuItems == null)
            return 0
        let removeCount = 0
        let node = menuItems._first
        do {
            if(typeof(ids) == "string" && ids == node.element?.command?.id) {
                menuItems._remove(node)
                removeCount++
            } else if (ids?.includes(node.element?.command?.id)) {
                menuItems._remove(node)
                removeCount++
            } else {
                continue
            }
        } while((node = node.next))
        return removeCount
    }
}

export class StandaloneKeyBindingUtils {
    _service = null
    constructor(editor) {
        this._service = editor?._standaloneKeybindingService
        if(this._service == null)
            throw new Error("cannot get _standaloneKeybindingService from editor")
    }

    getDefaultKeyBindings() {
        return this._service?._getResolver()?._defaultKeybindings
    }

    getKeyBindings() {
        return this._service?._getResolver()?._keybindings
    }

    getKeyBindingsMap() {
        return this._service?._getResolver()?._map
    }

    getDefaultBoundCommands() {
        return this._service?._getResolver()?._defaultBoundCommands
    }

    lookupPrimaryKeybinding(commandId, context) {
        return this._service?._getResolver()?.lookupPrimaryKeybinding(commandId, context)
    }

    resolve(context, currentChord, keypress) {
        return this.this._service?._getResolver()?.resolve(context, currentChord, keypress)
    }

    resolveKeybinding(keybinding) {
        return this._service?.resolveKeybinding(keybinding)
    }

    addDynamicKeybinding(commandId, binding, handler, when) {
        this._service?.addDynamicKeybinding(commandId, binding, handler, when)       
    }

    removeKeyBinding(commandId) {
        this.addDynamicKeybinding(`-${commandId}`, undefined, ()=>{}, undefined)
    }

    rebindCommand(commandId, newKeyBinding, handler, when) {
        this.removeKeyBinding(commandId)
        this.addDynamicKeybinding(commandId, newKeyBinding, handler, when)
    }
}

export function doClipboardFixForFx(editor) {
    let affectedActions = [
        "editor.action.clipboardCopyAction",
        "editor.action.clipboardPasteAction",
        "editor.action.clipboardCutAction",
        "editor.action.clipboardCopyWithSyntaxHighlightingAction",
    ]
    
    let fxFixActions = [
        {
            id: "editor.action.clipboardCopyAction.fx_fix",
            label: "Copy",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_C],
            contextMenuGroupId: "9_cutcopypaste",
            run: (e) => {
                editor?.copy()
            }
        },
        {
            id: "editor.action.clipboardPasteAction.fx_fix",
            label: "Paste",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_V],
            contextMenuGroupId: "9_cutcopypaste",
            run: (e) => {
                editor?.paste()
            }
        },
        {
            id: "editor.action.clipboardCutAction.fx_fix",
            label: "Cut",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_X],
            contextMenuGroupId: "9_cutcopypaste",
            run: (e) => {
                editor?.cut()
            }
        },
    ]
    
    let editorContextMenu = "EditorContext"
    let commandPaletteMenu = "CommandPalette"

    let keybindingUtils = new StandaloneKeyBindingUtils(editor._codeEditor)
    
    MenuUtils.removeMenuItemById(editorContextMenu, affectedActions)
    MenuUtils.removeMenuItemById(commandPaletteMenu, affectedActions)

    affectedActions.forEach((action)=>{
        keybindingUtils.removeKeyBinding(action.id)
    })

    fxFixActions.forEach((action)=>{
        editor._codeEditor.addAction(action)
    })
}