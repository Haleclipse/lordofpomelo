/*
 * Copyright (C) 2008 Nokia Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.View}
 */
WebInspector.DOMStorageItemsView = function(domStorage)
{
    WebInspector.View.call(this);

    this.domStorage = domStorage;

    this.element.addStyleClass("storage-view");
    this.element.addStyleClass("table");

    this.deleteButton = new WebInspector.StatusBarButton(WebInspector.UIString("Delete"), "delete-storage-status-bar-item");
    this.deleteButton.visible = false;
    this.deleteButton.addEventListener("click", this._deleteButtonClicked, this);

    this.refreshButton = new WebInspector.StatusBarButton(WebInspector.UIString("Refresh"), "refresh-storage-status-bar-item");
    this.refreshButton.addEventListener("click", this._refreshButtonClicked, this);
}

WebInspector.DOMStorageItemsView.prototype = {
    get statusBarItems()
    {
        return [this.refreshButton.element, this.deleteButton.element];
    },

    wasShown: function()
    {
        this.update();
    },

    willHide: function()
    {
        this.deleteButton.visible = false;
    },

    update: function()
    {
        this.detachChildViews();
        this.domStorage.getEntries(this._showDOMStorageEntries.bind(this));
    },

    _showDOMStorageEntries: function(error, entries)
    {
        if (error)
            return;

        this._dataGrid = this._dataGridForDOMStorageEntries(entries);
        this._dataGrid.show(this.element);
        this._dataGrid.autoSizeColumns(10);
        this.deleteButton.visible = true;
    },

    _dataGridForDOMStorageEntries: function(entries)
    {
        var columns = {key: {}, value: {}};

        columns.key.title = WebInspector.UIString("Key");
        columns.key.editable = true;

        columns.value.title = WebInspector.UIString("Value");
        columns.value.editable = true;

        var nodes = [];

        var keys = [];
        var length = entries.length;
        for (var i = 0; i < entries.length; i++) {
            var key = entries[i][0];
            var value = entries[i][1];
            var node = new WebInspector.DataGridNode({key: key, value: value}, false);
            node.selectable = true;
            nodes.push(node);
            keys.push(key);
        }

        var dataGrid = new WebInspector.DataGrid(columns, this._editingCallback.bind(this), this._deleteCallback.bind(this));
        length = nodes.length;
        for (var i = 0; i < length; ++i)
            dataGrid.rootNode().appendChild(nodes[i]);
        dataGrid.addCreationNode(false);
        if (length > 0)
            nodes[0].selected = true;
        return dataGrid;
    },

    _deleteButtonClicked: function(event)
    {
        if (!this._dataGrid || !this._dataGrid.selectedNode)
            return;

        this._deleteCallback(this._dataGrid.selectedNode);
    },

    _refreshButtonClicked: function(event)
    {
        this.update();
    },

    _editingCallback: function(editingNode, columnIdentifier, oldText, newText)
    {
        var domStorage = this.domStorage;
        if ("key" === columnIdentifier) {
            if (oldText)
                domStorage.removeItem(oldText);

            domStorage.setItem(newText, editingNode.data.value);
        } else {
            domStorage.setItem(editingNode.data.key, newText);
        }

        this.update();
    },

    _deleteCallback: function(node)
    {
        if (!node || node.isCreationNode)
            return;

        if (this.domStorage)
            this.domStorage.removeItem(node.data.key);

        this.update();
    },

    __proto__: WebInspector.View.prototype
}
