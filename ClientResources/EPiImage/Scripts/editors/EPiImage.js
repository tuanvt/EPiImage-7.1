define([
// dojo
"dojo",
"dojo/_base/declare",
"dojo/dom-construct",
"dojo/_base/lang",
  "dojo/_base/Deferred",
"dojo/dom-attr",
"dojo/json",
"dojo/mouse",
"dojo/on",
// dijit
"dijit/_Widget",
"dijit/_TemplatedMixin",
"dijit/_WidgetsInTemplateMixin",
"dijit/form/Button",
"dijit/form/TextBox",
"dijit/Dialog",

// epi.shell
"epi/dependency",
"epi/shell/dnd/Target",
"epi/routes",
// epi.cms
"epi-cms/legacy/LegacyDialogPopup",
"epi-cms/widget/_HasChildDialogMixin",
"epi-cms/widget/_Droppable",
"epi/shell/widget/_ValueRequiredMixin",

// resources
"dojo/text!./templates/EPiImage.html",
//Netcat app
"epiimage/editors/EpiImageInfoForm",
"epiimage/RequireModule!App"
],
function (
// dojo
    dojo,
    declare,
    domConstruct,
    lang,
    Deferred,
    domAttr,
    JSON,
    mouse,
    on,
// dijit
    _Widget,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Button,
    TextBox,
    Dialog,

// epi.shell
    dependency,
    Target,
    routes,
// epi.cms
    LegacyDialogPopup,
    _HasChildDialogMixin,
    _Droppable,
    _ValueRequiredMixin,

// resources
    template,
//Netcat app
EpiImageInfoForm,
appModule

    ) {

    return declare("epiimage.editors.EPiImage", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _HasChildDialogMixin, _ValueRequiredMixin, _Droppable], {

        // templateString: [protected] String
        //    A string that represents the default widget template.
        templateString: template,

        // summary:
        //    Editor widget for a file selector property.

        // _legacyDialogUrl: [public] String
        //    A string that represents the URL to the file browser dialog.
        _legacyDialogUrl: null,

        fileBrowserMode: "file",

        // contentLink: [pubic] String
        //      Content reference of the content currently being edited.
        contentLink: "",

        value: null,

        postMixInProperties: function () {
            this.inherited(arguments);

            if (!this._legacyDialogUrl) {
                this._legacyDialogUrl = this.getLegacyDialogUrl();
            }

            this.acceptDataTypes = this.acceptDataTypes || ["fileurl"];
        },

        destroy: function () {

            if (this._dialog) {
                this._dialog.destroyRecursive();
                delete this._dialog;
            }

            this.inherited(arguments);

        },

        postCreate: function () {
            // summary:
            //    Set the value to the textbox after the DOM fragment is created.
            // tags:
            //    protected

            this.inherited(arguments);

            //We need to set the label here
            this.btnCreate.set("label", "Add Image ...");
            this.connect(this.btnCreate, "onClick", this._showDialog);
        },

        _setStateAttr: function (value) {
            this._set("state", value);
            //this.imgNode.set("state", value);
        },

        onDrop: function () {
            // summary:
            //    Triggered when something has been dropped onto the widget.
            //
            // tags:
            //    public callback

            this.focus();
            //this.onChange(this.value);
            //this._setValue(this._serializeImage(this.value, ""));
        },

        onChange: function (value) {
            //domAttr.set(this.imgNode, "src", value || '');
            //this._setValue(value);

        },

        getLegacyDialogUrl: function () {
            var contextInstance = dependency.resolve("epi.shell.ContextService");
            var pageId = (contextInstance.currentContext != null) ? contextInstance.currentContext.id : "";

            // pass the current context id (current page id) to the page, to init the FileManagement page with input page.
            var params = {
                moduleArea: "LegacyCMS",
                path: "Edit/FileManagerBrowser.aspx",
                id: this.contentLink,
                parentid: pageId,
                browserselectionmode: this.fileBrowserMode
            };
            if (this.value) {
                params.selectedfile = this.value;
            }
            return routes.getActionPath(params);
        },

        getLegacyDialogParameters: function () {
            return {
                defaultActionsVisible: false,
                autoFit: true,
                features: {
                    width: 800,
                    height: 650
                }
            };
        },

        getValueFromCallbackResult: function (callbackResult) {
            var val = (callbackResult.items) ? callbackResult.items[0].path : null;

            return val;
        },

        isCancelOnCallback: function (callbackResult) {
            return callbackResult.closeAction === "cancel";
        },

        _showDialog: function () {
            if (!this._dialog) {
                var params = this.getLegacyDialogParameters();

                this._dialog = new LegacyDialogPopup(lang.mixin(params, {
                    url: this._legacyDialogUrl
                }));


                this.connect(this._dialog, 'onHide', this._onHide);
                this.connect(this._dialog, 'onCallback', this._onCallback);
            }

            this.isShowingChildDialog = true;

            this._dialog.show();

        },

        _showEditDialog: function () {
            var self = this;
            var description = "";
            var linkUrl = "";
            var title = "";
            if (!this._dialog) {

                var epiImageInfoForm = new EpiImageInfoForm({ description: description, linkUrl: linkUrl,title:title });

                var settingsDialog = {
                    confirmActionText: "Save",
                    title: "Edit Image",
                    content: epiImageInfoForm
                };

                this._dialog = new Dialog(settingsDialog);
                this.connect(this._dialog, 'onHide', this._onHide);
                this.connect(this._dialog, 'onExecute', lang.hitch(this, function () {
                    var imageInfo = epiImageInfoForm.get("value");

                    if (imageInfo) {
                        dojo.forEach(self.imageList, function (item, i) {
                            if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                                self.imageList[i].description = imageInfo.description;
                                self.imageList[i].linkUrl = imageInfo.linkUrl;
                                self.imageList[i].title = imageInfo.title;
                            }
                        });
                        self._setValue(self.imageList);
                    }
                }));

            }

            this.isShowingChildDialog = true;

            this._dialog.show();
        },

        _onHide: function () {
            this.isShowingChildDialog = false;
            this._dialog.destroyRecursive();
            delete this._dialog;
        },

        _onCallback: function (value) {
            if (!value || this.isCancelOnCallback(value)) { return; }
            else {
                var val = this.getValueFromCallbackResult(value);

                if (this.value !== val) {

                    this._setValue(this._serializeImage(val, ""));
                    this.onChange(this.value);
                }
            }
        },

        _setValueAttr: function (value) {
            this._setValue(value);
            //this.textbox.set("value", this.value || ''); // Set a textbox's value to null in IE will make it display 'null'
            //domAttr.set(this.imgNode, "src", this.value || '');

            this._legacyDialogUrl = this.getLegacyDialogUrl();

            this._started && this.validate();
        },
        _setValue: function (value) {
            var self = this;
            if (value && value.imageUrl) {

                var registry = dependency.resolve("epi.storeregistry");
                Deferred.when(registry.get("CMS7ImageStore").executeMethod("GetImageInfo", "", {
                    imagePath: value.imageUrl
                }), lang.hitch(this, function (response) {
                    //set image source and value
                    if (response.statusResponse == "OK") {
                        //create remove button for each image
                        //                        var imgRemoveButton = new Button({
                        //                            label: "X",
                        //                            onClick: function () {
                        //                                self._removeImage(item.imageId);
                        //                            }
                        //                        });

                        //                        dojo.addClass(imgRemoveButton.domNode, "remove-button");

                        //create edit info button for each image
                        var imgEditButton = new Button({
                            label: "Edit Info",
                            onClick: function () {
                                self._showEditDialog();
                            }
                        });
                        dojo.addClass(imgEditButton.domNode, "edit-button");


                        //domConstruct.place(imgRemoveButton.domNode, this.divThumb, "last");
                        domConstruct.place(imgEditButton.domNode, this.divThumb, "last");


                        // display buttons when hover the div
                        on(this.divThumb, mouse.enter, function () {
                            //domAttr.set(imgRemoveButton, "style", "display:block");
                            domAttr.set(imgEditButton, "style", "display:block");
                        });

                        on(this.divThumb, mouse.leave, function () {
                            //domAttr.set(imgRemoveButton, "style", "display:none");
                            domAttr.set(imgEditButton, "style", "display:none");
                        });
                        domAttr.set(this.imgNode, "src", response.imageUrl || '');

                        this._serializeImage(response.imageUrl, response.imageDescription,response.imageTitle);
                        //alert(domAttr.get(node, "src"));
                        this._set("value", this._serializeImage(response.imageUrl, response.imageDescription,response.imageTitle));
                        this.btnCreate.set("label", "Edit Image ...");
                        domAttr.set(this.lblError, "innerHTML", "");
                    } else {
                        domAttr.set(this.lblError, "innerHTML", response.statusResponse);
                    }

                }
                    ));







            } else if (value) {
                this._setValue(this._serializeImage(value, ""));
            }


        },

        _setReadOnlyAttr: function (value) {
            this._set("readOnly", value);

            this.btnCreate.set("disabled", value);
            //this.textbox.set("disabled", value);
        },

        focus: function () {
            this.btnCreate.focus();
        },

        _serializeImage: function (imgSrc, imgDescription, linkUrl, title) {
            // Return empty string for 
            if (!imgSrc || typeof imgSrc !== "string") {
                return "";
            }

            return ({ imageUrl: imgSrc, imageDescription: imgDescription, linkUrl: linkUrl, title:title});
        }
    });
});