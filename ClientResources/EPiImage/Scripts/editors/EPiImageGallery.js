// <summary>
// ##### EPiImage Gallery Client Editor ########################################################################
// </summary>
// <remarks>
// 2013-07-05 TVT: Created
// </remarks>
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
"dojo/dnd/Source",
"dojo/dnd/Target",
"dojo/dnd/Avatar",
"epi/routes",
// epi.cms
"epi-cms/legacy/LegacyDialogPopup",
"epi-cms/widget/_HasChildDialogMixin",
"epi/shell/widget/_ValueRequiredMixin",

// resources
"dojo/text!./templates/EPiImageGallery.html",
"epi/i18n!epi-cms/nls/episerver.cms.contentediting.editors.contentarea",
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
    Source,
    Target,
    Avatar,
    routes,
// epi.cms
    LegacyDialogPopup,
    _HasChildDialogMixin,
    _ValueRequiredMixin,

// resources
    template,
    resources,

//Netcat app
    EpiImageInfoForm,
    appModule
    ) {

    return declare("epiimage.editors.EPiImageGallery", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _HasChildDialogMixin, _ValueRequiredMixin], {

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

        imageList: [],
        imageSource: null,
        postMixInProperties: function () {
            this.inherited(arguments);

            if (!this._legacyDialogUrl) {
                this._legacyDialogUrl = this.getLegacyDialogUrl();
            }

            //this.acceptDataTypes = this.acceptDataTypes || ["fileurl"];
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
            var self = this;
            this.inherited(arguments);

            //We need to set the label here
            this.btnCreate.set("label", "+ Add Image");
            this.connect(this.btnCreate, "onClick", this._showAddDialog);

            //set up the images source
            //this.imageSource = new Source(this.imageGallery);
            this.imageSource = new Source(this.imageGallery, {
                creator: lang.hitch(this, this._dndSourceItemCreator),
                accept: []
            });

            this.connect(this.imageSource, "onDndDrop", this._onDndDrop);

            //create the image source


        },
        _onDndDrop: function (source, nodes, copy, target) {

        },
        _dndSourceItemCreator: function (item, hint) {
            var node;
            var self = this;
            if (hint != "avatar") {

                //create the wrap div for each image
                node = domConstruct.create('div');
                domAttr.set(node, "id", item.imageId);
                //create image holder for each image

                var img = domConstruct.create('img');
                domAttr.set(img, "src", item.imageUrl);


                //if (image.description) {
                //    domAttr.set(img, "alt", image.description);
                //}


                domAttr.set(node, "class", 'image-thumb');

                //create remove button for each image
                var imgRemoveButton = new Button({
                    label: "X",
                    onClick: function () {
                        self._removeImage(item.imageId);
                    }
                });

                dojo.addClass(imgRemoveButton.domNode, "remove-button");

                //create edit info button for each image
                var imgEditButton = new Button({
                    label: "Edit Info",
                    onClick: function () {
                        self._showEditDialog(item.imageId);
                    }
                });
                dojo.addClass(imgEditButton.domNode, "edit-button");


                domConstruct.place(img, node, "last");
                domConstruct.place(imgRemoveButton.domNode, node, "last");
                domConstruct.place(imgEditButton.domNode, node, "last");


                // display buttons when hover the div
                on(node, mouse.enter, function () {
                    domAttr.set(imgRemoveButton, "style", "display:block");
                    domAttr.set(imgEditButton, "style", "display:block");
                });

                on(node, mouse.leave, function () {
                    domAttr.set(imgRemoveButton, "style", "display:none");
                    domAttr.set(imgEditButton, "style", "display:none");
                });

            } else {

                //create the wrap div for each image
                node = domConstruct.create('div');

                //create image holder for each image

                var avatarImg = dojo.doc.createElement('img');
                domAttr.set(avatarImg, "src", item);
                domConstruct.place(avatarImg, node);

            }
            return {
                "node": node,
                "type": "image",
                "data": item.imageUrl || item
            };
        },
        _setStateAttr: function (value) {
            this._set("state", value);
            //this.imgNode.set("state", value);
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
        _showAddDialog: function () {
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
        _showEditDialog: function (imageId) {
            var self = this;
            var description = "";
            var linkUrl = "";
            if (!this._dialog) {
                dojo.forEach(self.imageList, function (item, i) {
                    if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                        description = self.imageList[i].description;
                        linkUrl = self.imageList[i].linkUrl;
                    }
                });

                var epiImageInfoForm = new EpiImageInfoForm({ imageId: imageId, description: description, linkUrl: linkUrl });

                var settingsDialog = {
                    confirmActionText: "Save",
                    title: "Edit Image",
                    content: epiImageInfoForm
                };

                this._dialog = new Dialog(settingsDialog);
                this.connect(this._dialog, 'onHide', self._onHide);
                this.connect(epiImageInfoForm, 'onCancel', self._onHide);
                this.connect(this._dialog, 'onExecute', lang.hitch(this, function () {
                    var imageInfo = epiImageInfoForm.get("value");

                    if (imageInfo) {
                        dojo.forEach(self.imageList, function (item, i) {
                            if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                                self.imageList[i].description = imageInfo.description;
                                self.imageList[i].linkUrl = imageInfo.linkUrl;
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
                this._addValue(val);
                this.onChange(this.value);
            }

        },

        _setValueAttr: function (value) {
            if (value) {
                var images = JSON.parse(value);

                if (images && images.length > 0) {
                    this._setValue(images);
                    this._setupImages(images);
                    this.imageList = images;

                }
            }

            this._legacyDialogUrl = this.getLegacyDialogUrl();

            this._started && this.validate();
        },

        _addValue: function (imageUrl) {
            if (imageUrl) {

                var registry = dependency.resolve("epi.storeregistry");
                Deferred.when(registry.get("CMS7ImageStore").executeMethod("GetGalleryImageInfo", "", {
                    imagePath: imageUrl
                }), lang.hitch(this, function (response) {
                    //set image source and value
                    if (response.statusResponse == "OK") {
                        this._addImage(response);

                        this.imageList.push(this._serializeImage(response));
                        if (this.value) {
                            this.value += this._imageToString(response);
                        } else {
                            this.value = "";
                            this.value += this._imageToString(response);
                        }
                        //this._setValue(this.value);
                        this._set("value", this.value);
                        domAttr.set(this.lblError, "innerHTML", "");
                    } else {
                        domAttr.set(this.lblError, "innerHTML", response.statusResponse);
                    }
                }));
            }

        },
        _setupImages: function (value) {
            if (value && value.length > 0) {
                //                for (var i = 0; i < value.length; i++) {
                //                    var image = value[i];
                //                    if (!image.imageUrl) return;
                //                    //this._addImage(image);
                //                }
                this.imageSource.insertNodes(false, value);

            }
        }
        ,

        _setValue: function (value) {
            var propertyValue = "";
            if (value && value.length > 0) {
                for (var i = 0; i < value.length; i++) {
                    var image = value[i];
                    if (!image.imageUrl) return;
                    propertyValue += this._imageToString(image);
                }
                this._set("value", propertyValue);
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
        _imageToString: function (image) {
            return image.imageUrl + ((image.description && image.description.length > 0) ? "|" + image.description : "|") + "|" + image.imageId + ((image.linkUrl && image.linkUrl.length > 0) ? "|" + image.linkUrl : "|") + "¤";
        },

        _serializeImage: function (image) {
            // Return empty string for 
            if (!image.imageUrl || typeof image.imageUrl !== "string") {
                return "";
            }
            return ({ imageUrl: image.imageUrl, description: image.description, imageId: image.imageId, linkUrl: image.linkUrl });
        },
        _removeImage: function (imageId) {
            //alert("Remove " + imageId);
            var self = this;
            dojo.forEach(this.imageList, function (item, i) {
                if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                    self.imageList.splice(i, 1);
                    dojo.destroy(imageId);
                    return;
                }
            });
            this._setValue(self.imageList);
        },
        _addImage: function (value) {
            var self = this;
            this.imageSource.insertNodes(false, [value]);
        }

    });
});