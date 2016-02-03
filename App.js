Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: { type: 'hbox' },
    defaults: { padding: 10 },
    items: [
        {xtype: 'container',itemId:'render_example', flex: 1},
        {xtype: 'container',itemId:'line_by_line_example', flex: 1}
    ],
    launch: function() {
        this._getSomeStories();
    },
    _getSomeStories: function() {
        if ( this.render_grid ) { this.render_grid.destroy(); }
        if ( this.line_grid ) { this.line_grid.destroy(); }
        Ext.create('Rally.data.WsapiDataStore',{
            autoLoad: true,
            model: 'User Story',
            fetch: ['RevisionHistory','Revisions','FormattedID','Name','RevisionNumber','CreationDate','User'],
            listeners: {
                load: function(store,data,success) {
                    this._showRenderedGrid(store);
                    // this._prepareLineByLineGrid(data);
                },
                scope: this
            }
        });
    },
    /* formats data for the revision history cell */
    _revisionRenderer: function(value,meta,record) {

        var formatted_value_array = record.get("RevisionArray");
        if (formatted_value_array) {
            return formatted_value_array;
        } else {
            Rally.data.ModelFactory.getModel({
                type: 'RevisionHistory',
                scope: this,
                success: function(model) {
                    model.load(value,
                    {
                        fetch : true,
                        callback : function(records,op,success) {
                            records.getCollection('Revisions').load({
                                fetch: true,
                                callback: function(records, operation, success) {
                                    record.set("RevisionArray", _.map(records,function(r){
                                        return r.get("RevisionNumber") + " on " + r.get("CreationDate") + " by " + r.get("User")._refObjectName;
                                    }).join("<br/>"));
                                }
                            });
                        }
                    });
                }
            });
            return "...";
        }
    },

    _showRenderedGrid: function(store) {
        if ( this.render_grid ) { this.render_grid.destroy(); }
        this.render_grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            columnCfgs: [
                { text: 'ID', dataIndex: 'FormattedID', width : 10 },
                { text: 'Name', dataIndex: 'Name',width : 50 },
                { text: 'Revs', dataIndex: 'RevisionHistory', renderer: this._revisionRenderer, flex: 1}
            ]
        });
        this.down('#render_example').add(this.render_grid);
    },
    _prepareLineByLineGrid: function(data) {
        var lines = [];
        /* TODO: see if this is what a TransformStore might be good for? */
        Ext.Array.each(data,function(item) {
            Ext.Array.each(item.get('RevisionHistory').Revisions, function(rev){
                var line = {
                    FormattedID: item.get('FormattedID'),
                    Name: item.get('Name'),
                    RevisionNumber: rev.RevisionNumber,
                    RevisionDate: rev.CreationDate
                    // RevisionAuthor: rev.User._refObjectName
                };
                lines.push(line);
            });
        });
        /* could be much more compact, but I like to separate the data gathering from the data display */
        Ext.create('Rally.data.custom.Store',{
            autoLoad: true,
            data: lines,
            listeners: {
                load: function(store,data,success) {
                    this._showLineByLineGrid(store);
                },
                scope: this
            }
        });
    },

    _showLineByLineGrid: function(store) {
        if ( this.line_grid ) { this.line_grid.destroy(); }
        this.line_grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            columnCfgs: [
                { text: 'ID', dataIndex: 'FormattedID' },
                { text: 'Name', dataIndex: 'Name' },
                { text: 'id', dataIndex: 'RevisionNumber'},
                { text: 'date', dataIndex: 'RevisionDate', flex: 1 },
                { text: 'author', dataIndex: 'RevisionAuthor' }
            ]
        });
        this.down('#line_by_line_example').add(this.line_grid);
    }
});
