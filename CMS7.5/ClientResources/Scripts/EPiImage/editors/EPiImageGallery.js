define([
// dojo
    "dojo",
    "dojo/dom-construct",
    "dojo/mouse",
    "dojo/on",
    "dojo/json",
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/lang",

    "dojo/Deferred",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style",

    "dojo/query",
    "dojo/string",
    "dojo/when",

// dijit,
    "dijit/_CssStateMixin",
    "dijit/_TemplatedMixin",
    "dijit/_Widget",
    "dijit/_WidgetsInTemplateMixin",

    "dijit/focus",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/Dialog",

// epi.shell
    "epi/dependency",
    "dojo/dnd/Source",    
    //"dojo/dnd/Target",
    "epi-cms/core/PermanentLinkHelper",
    "dojo/dnd/Avatar",
    "epi/routes",
    "epi/shell/TypeDescriptorManager",
    "epi/shell/conversion/ObjectConverterRegistry",
    "epi/shell/widget/_ValueRequiredMixin",
    "epi/shell/widget/dialog/Dialog",
    "epi/shell/dnd/Target",

// epi.cms
    "epi-cms/core/ContentReference",
    "epi-cms/core/PermanentLinkHelper",
    "epi-cms/contentediting/ContentActionSupport",
    //"epi-cms/widget/_Droppable",
    //"epi-cms/widget/_HasClearButton",
    "epi-cms/widget/_HasChildDialogMixin",
    "epi-cms/widget/ContentSelectorDialog",

// resources
    "dojo/text!./templates/EPiImageGallery.html",
    "epi/i18n!epi/cms/nls/episerver.cms.widget.contentselector",
//Niteco app
"epiimage/editors/EpiImageInfoForm",
"app/RequireModule!App"
],

function (
// dojo
    dojo,
    domConstruct,
    mouse,
    on,
    JSON,
    array,
    declare,
    lang,

    Deferred,
    domAttr,
    domClass,
    domStyle,

    query,
    stringUtil,
    when,

// dijit
    _CssStateMixin,
    _TemplatedMixin,
    _Widget,
    _WidgetsInTemplateMixin,

    focusManager,
    Button,
    TextBox,
    BaseDialog,

// epi.shell
    dependency,
    Source,
    //Target,
    PermanentLinkHelper,
    Avatar,
    routes,
    TypeDescriptorManager,
    ObjectConverterRegistry,
    _ValueRequiredMixin,
    Dialog,
    Target,

// epi.cms
    ContentReference,
    PermanentLinkHelper,
    ContentActionSupport,
    //_Droppable,
    //_HasClearButton,
    _HasChildDialogMixin,
    ContentSelectorDialog,

// resources
    template,
    localization,
//Niteco app
    EpiImageInfoForm,
    appModule
) {

    return declare("epiimage.editors.EPiImageGallery", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin, /*_HasClearButton,*/ _HasChildDialogMixin, /*_Droppable,*/ _ValueRequiredMixin], {

        templateString: template,
        
        _store: null,

        roots: null,

        value: null,

        // required: Boolean
        //		User is required to enter data into this field.
        required: false,

        // missingMessage: [public] String
        //    Message which is displayed when required is true and value is empty.
        missingMessage: localization.requiredmessage,

        // tooltipPosition: String[]
        //		See description of `dijit.Tooltip.defaultPosition` for details on this parameter.
        tooltipPosition: [],

        // contentLink: [pubic] String
        //      Content reference of the content being edited.
        contentLink: null,

        permanentLink: null,

        // canSelectOwnerContent: [public] Boolean
        //      Indicates whether the owner content that is being edited can be selected
        canSelectOwnerContent: false,

        // accessLevel: [public] Enum
        //      The access right level for the content node can be selected
        accessLevel: ContentActionSupport.accessLevel.Read,

        // showAllLanguages: Boolean
        //      Flags to indicate that the content tree should show all content in multiple languages or not.
        showAllLanguages: true,
        repositoryKey: "media",
        allowedTypes:['episerver.core.icontentimage'],        
        imageList: [],
        imageSource: null,
        dropTarget: null,
        /*_setSelectedContentNameAttr: function (value) {
            query(this.selectedContentNameNode).text(value);
        },*/

        /*_setDisabledAttr: function (value) {
            this.inherited(arguments);
            this.button.set("disabled", value);
            this._set("disabled", value);
        },

        _setSelectedContentLinkAttr: { node: "selectedContentLinkNode", type: "innerHTML" },*/

        postMixInProperties: function () {
            // summary:
            //		Initialize properties
            // tags:
            //    protected

            this.inherited(arguments);

            var registry = dependency.resolve("epi.storeregistry");
            this._store = registry.get("epi.cms.content.light");

            if (!this.roots) {
                var contentRepositoryDescriptors = this.contentRepositoryDescriptors || dependency.resolve("epi.cms.contentRepositoryDescriptors");
                var settings = contentRepositoryDescriptors[this.repositoryKey];
                this.roots = settings.roots;
            }

            //Create the name attribute for the hidden input if provided
            this.nameAttrSetting = this.name ? ('name="' + this.name.replace(/"/g, "&quot;") + '"') : '';
        },

        postCreate: function () {
            // summary:
            //      Overridden to initialize ui elements when no value is set.

            this.inherited(arguments);

            var self = this; 
            
            //We need to set the label here
            this.btnCreate.set("label", "+ Add Image");
            this.connect(this.btnCreate, "onClick", this._onButtonClick);
            
            this.imageSource = new Source(this.imageGallery, {
                creator: lang.hitch(this, this._dndSourceItemCreator),
                accept: []
            });
            
            // setup the dropable area for adding image by drag drop
            this.dropTarget = new Target(this.dropAreaNode, {
                accept: this.allowedTypes,
                createItemOnDrop: false
            });
            
            // able to sort and update an existing list
            dojo.connect(this.imageSource, "onDrop", function (source, node, copy) {
                var list = [];
                source.getAllNodes().forEach(function (obj, j) {
                    dojo.forEach(self.imageList, function (item, i) {
                        if (obj.id == item.imageId) {
                            list.push(self.imageList[i])
                        }
                    });
                });
                self._setValue(list);
                self.onChange(self.value);
            });

            this.connect(this.dropTarget, "onDropData", "onDropData");
            this.connect(this.dropTarget, "onDrop", "onDrop");
            
            // load data from this.value to this.imageGallery, needed for onPageEdit
            self._setupImages(self.imageList);
        },
        onDrop: function () {
            // summary:
            //    Triggered when something has been dropped onto the widget.
            //
            // tags:
            //    public callback

            this.focus();
            
        },
        onDropData: function (dndData, source, nodes, copy) {
            //summary:
            //    Handle drop data event.
            //
            // dndData:
            //    Dnd data extracted from the dragging items which have the same data type to the current target
            //
            // source:
            //    The dnd source.
            //
            // nodes:
            //    The dragging nodes.
            //
            // copy:
            //    Denote that the drag is copy.
            //
            // tags:
            //    private

            var dropItem = dndData ? (dndData.length ? dndData[0] : dndData) : null;

            if (!dropItem) {
                return;
            }

            // invoke the onDropping required by SideBySideWrapper and other widgets listening on onDropping 
            if (this.onDropping) {
                this.onDropping();
            }

            this._dropDataProcessor(dropItem);
        },

        _dropDataProcessor: function (dropItem) {
            when(dropItem.data, lang.hitch(this, function (model) {

                var self = this,
                    type = dropItem.type;

                function createImage(data) {
                    
                    
                    //var content = PermanentLinkHelper.getContent(data.permanentUrl, { "allLanguages": true });
                    when(PermanentLinkHelper.getContent(data.permanentUrl, { "allLanguages": true }), lang.hitch(this, function (itemContent) {
                        self._addValue(itemContent.contentLink);
                        self.onChange(self.value);
                    }));
                    
                }

                if (type && type.indexOf("fileurl") !== -1) {
                    createImage(model);
                }

                var typeId = model.typeIdentifier;

                var editorDropBehaviour = TypeDescriptorManager.getValue(typeId, "editorDropBehaviour");

                if (editorDropBehaviour) {

                    if (editorDropBehaviour === 1) {
                        //Default: doing nothing
                        return;
                    }

                    var converter, baseTypes = TypeDescriptorManager.getInheritanceChain(typeId);

                    for (var i = 0; i < baseTypes.length; i++) {
                        var basetype = baseTypes[i];
                        converter = ObjectConverterRegistry.getConverter(basetype, basetype + ".link");
                        if (converter) {
                            break;
                        }
                    }
                    if (!converter) {
                        return;
                    }

                    when(converter.convert(typeId, typeId + ".link", model), lang.hitch(this, function (data) {

                        if (!data.url) {
                            //If the page does not have a public url we do nothing.
                        }
                        else {
                            switch (editorDropBehaviour) {
                                case 2://Link
                                    break;
                                case 3://Image
                                    createImage(data);
                                    break;
                            }
                        }
                    }));
                }
            }));
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
        focus: function () {
            this.btnCreate.focus();
        },
        _showEditDialog: function (imageId) {
            var self = this;
            var description = "";
            var linkUrl = "";
            var title = "";
            if (!this.dialog) {
                dojo.forEach(self.imageList, function (item, i) {
                    if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                        title = self.imageList[i].title;
                        description = self.imageList[i].description;
                        linkUrl = self.imageList[i].linkUrl;
                    }
                });

                var epiImageInfoForm = new EpiImageInfoForm({ imageId: imageId, description: description, linkUrl: linkUrl,title:title });                

                this.dialog = new BaseDialog({
                    title: "Edit Image",                    
                    content: epiImageInfoForm,
                    confirmActionText: "Save",                    
                });
                
                this.connect(this.dialog, 'onExecute', lang.hitch(this, function () {
                    var imageInfo = epiImageInfoForm.get("value");

                    if (imageInfo) {
                        dojo.forEach(self.imageList, function (item, i) {
                            if (item && item.imageId && item.imageId.length > 0 && item.imageId == imageId) {
                                self.imageList[i].title = imageInfo.title;
                                self.imageList[i].description = imageInfo.description;
                                self.imageList[i].linkUrl = imageInfo.linkUrl;
                            }
                        });
                        self._setValue(self.imageList);
                    }
                }));
                this.connect(this.dialog, 'onHide', self._onHide);
                this.connect(epiImageInfoForm, 'onCancel', self._onHide);
            }

            this.isShowingChildDialog = true;

            this.dialog.show();
        },       
        _onHide: function () {
            this.isShowingChildDialog = false;
            this.dialog.destroyRecursive();
            delete this.dialog;
        },
        _setReadOnlyAttr: function (value) {
            this._set("readOnly", value);

            this.btnCreate.set("disabled", value);
            //this.textbox.set("disabled", value);
        },        
        _setValueAttr: function (value) {
            //summary:
            //    Value's setter.
            //
            // value: String
            //    Value to be set.
            //
            // tags:
            //    protected

            //this._setValueAndFireOnChange(value);
            if (value) {
                var images = JSON.parse(value);

                if (images && images.length > 0) {
                    this._setValue(images);
                    //this._setupImages(images);
                    this.imageList = images;

                }
            }            
        },
        _setupImages: function (value) {
            if (value && value.length > 0 && (this.imageSource != null)) {
                this.imageSource.insertNodes(false, value);
            }
        }
        ,
        _getDialog: function () {
            // summary:
            //		Create page tree dialog
            // tags:
            //    protected

            // Verifies that the dialog instance and its dom node existings or not
            if (this.dialog && this.dialog.domNode) {
                return this.dialog;
            }

            var title = localization.title;
            if (this.allowedTypes && this.allowedTypes.length === 1) {
                var name = TypeDescriptorManager.getResourceValue(this.allowedTypes[0], "name");
                if (name) {
                    title = stringUtil.substitute(localization.format, [name]);
                }
            }

            this.contentSelectorDialog = new ContentSelectorDialog({
                canSelectOwnerContent: this.canSelectOwnerContent,
                showButtons: false,
                roots: this.roots,
                allowedTypes: this.allowedTypes,
                showAllLanguages: this.showAllLanguages
            });

            this.dialog = new Dialog({
                title: title,
                dialogClass: "epi-dialog-portrait",
                content: this.contentSelectorDialog,
                destroyOnHide: true
            });

            this.connect(this.contentSelectorDialog, "onChange", "_setDialogButtonState");
            this.connect(this.dialog, 'onExecute', '_onDialogExecute');
            this.connect(this.dialog, 'onHide', '_onHide');
            this.connect(this.dialog, 'onCancel', '_onHide');

            return this.dialog;
        },

        _isContentAllowed: function (contentTypeIdentifier) {
            // Summary:
            //    Checks whether the given content type belongs to the any of the allowedTypes/parent type or not
            //
            // contentTypeIdentifier: String
            //    The content type identifier
            //
            // tags:
            //    Private

            var allowed = array.indexOf(this.allowedTypes, contentTypeIdentifier) !== -1;

            if (!allowed) {
                //If it's not a direct match, check if the type inherits an accepted type.
                allowed = array.some(this.allowedTypes, function (type) {
                    return TypeDescriptorManager.isBaseTypeIdentifier(contentTypeIdentifier, type);
                });
            }

            return allowed;
        },

        _onButtonClick: function () {
            // Summary:
            //    Handle pick button click
            // tags:
            //    private

            when(this._getContentData(this.contentLink), lang.hitch(this, function (content) {

                // if the current content is any of allowedTypes then allow to select it
                this.canSelectOwnerContent = content && this._isContentAllowed(content.typeIdentifier);
                var dialog = this._getDialog();
                this.isShowingChildDialog = true;
                
                dialog.show();
                
            }));
        },        
        _onDialogExecute: function () {
            //summary:
            //    Handle dialog close
            // tags:
            //    private
            var getValue = this.contentSelectorDialog.get('value');
            
            if (!getValue) { return; }
            else {                
                this._addValue(getValue);
                this.onChange(this.value);
            }

            //var value = this.contentSelectorDialog.get('value');
            //this._setValueAndFireOnChange(value);
        },

        _convertValueToContentReference: function (value) {
            //summary:
            //
            // tags:
            //    private
            return new ContentReference(value);
        },
        /*_setValueAndFireOnChange: function (value) {
            //summary:
            //    Gets the content data by selected value, updates the view and calls onChange if value was changed
            // tags:
            //    private

            var contentLink = value === '-' ? this.contentLink : value;

            this.set("permanentLink", null);

            when(this._getContentData(contentLink), lang.hitch(this, function (content) {

                var hasChange = this.value !== contentLink;

                this.value = contentLink;
                //this.input.value = this.value;
                this._started && this.validate();
                //this._updateDisplayNode(content);

                if (hasChange) {
                    this.onChange(contentLink);
                }

                if (content) {
                    this.set("permanentLink", PermanentLinkHelper.toPermanentLink(content));
                }
            }));
        },*/
        _getContentPermanentLink:function(value) {
            var contentLink = value === '-' ? this.contentLink : value;
            var contentPermanentLink = '';
            when(this._getContentData(contentLink), lang.hitch(this, function (content) {

                //var hasChange = this.value !== contentLink;

                //this.value = contentLink;
                //this.input.value = this.value;
                //this._started && this.validate();
                //this._updateDisplayNode(content);

                //if (hasChange) {
                  // this.onChange(contentLink);
                //}

                if (content) {
                    contentPermanentLink = PermanentLinkHelper.toPermanentLink(content);
                }
            }));
            return contentPermanentLink;
        },
       
        _getContentData: function (contentLink) {
            //summary:
            //    Loads the content data from the store
            // tags:
            //    private

            if (!contentLink) {
                return null;
            }
            return this._store.get(contentLink);
        },

        _getValueAttr: function () {
            //summary:
            //    Value's getter
            // tags:
            //    protected

            return this.value;
        },

        _onFocus: function () {
            // summary:
            //		This is where widgets do processing for when they start being active,
            //		such as changing CSS classes.  See onFocus() for more details.
            // tags:
            //		protected

            if (this.get("disabled")) {
                return;
            }
            this.inherited(arguments);
            this.validate();
        },


        _onBlur: function () {
            // summary:
            //		This is where widgets do processing for when they stop being active,
            //		such as changing CSS classes.  See onBlur() for more details.
            // tags:
            //		protected

            if (this.get("disabled")) {
                return;
            }
            this.inherited(arguments);
            this.validate();
        },

        /*focus: function () {
            // summary:
            //       Put focus on this widget
            // tags:
            //      public

            if (!this.button.disabled && this.button.focusNode && this.button.focusNode.focus) {
                try {
                    focusManager.focus(this.button.focusNode);
                } catch (e) {
                    /*squelch errors from hidden nodes*/
                /*}
            }
        },*/

        onChange: function (value) {
            // summary:
            //    Fired when value is changed.
            //
            // value:
            //    The value
            // tags:
            //    public, callback
        },

        /*_updateDisplayNode: function (content) {
            //summary:
            //    Update widget's display text
            // tags:
            //    protected

            if (content) {
                domClass.remove(this.domNode, 'epi-noValue');
                domClass.remove(this.resourceName, 'dijitPlaceHolder');

                this.set("selectedContentName", content.name);
                this.set("selectedContentLink", new ContentReference(content.contentLink).id);
            }
            else {
                domClass.add(this.domNode, 'epi-noValue');
                domClass.add(this.resourceName, 'dijitPlaceHolder');

                this.set("selectedContentName", localization.helptext);
                this.set("selectedContentLink", "");
            }
        },*/

        reset: function () {
            this.set("value", null);
        },

        _setDialogButtonState: function (contentLink) {
            // summary:
            //    Set state of dialog button.
            //
            // tags:
            //    protected

            var self = this;

            if (!contentLink) {
                return;
            }

            when(self._store.get(contentLink), function (content) {
                self.dialog.definitionConsumer.setItemProperty(self.dialog._okButtonName, "disabled", !ContentActionSupport.hasAccess(content.accessMask, self.accessLevel));
            });
        },
        _addValue: function (contentRefId) {
            if (contentRefId) {

                var registry = dependency.resolve("epi.storeregistry");                
                when(registry.get("CMS7ImageStore").executeMethod("GetGalleryImageInfo", "", {
                    contentRefId: contentRefId
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
        _imageToString: function (image) {
            return image.imageUrl + ((image.description && image.description.length > 0) ? "|" + image.description : "|") + "|" + image.imageId + ((image.linkUrl && image.linkUrl.length > 0) ? "|" + image.linkUrl : "|") + ((image.title && image.title.length > 0) ? "|" + image.title : "|") + "¤";
        },
        _serializeImage: function (image) {
            // Return empty string for 
            if (!image.imageUrl || typeof image.imageUrl !== "string") {
                return "";
            }
            return ({ imageUrl: image.imageUrl, description: image.description, imageId: image.imageId, linkUrl: image.linkUrl,title:image.title });
        },
        _addImage: function (value) {         
            this.imageSource.insertNodes(false, [value]);
        },
        _setValue: function (value) {
            var propertyValue = "";
            if (value && value.length > 0) {
                for (var i = 0; i < value.length; i++) {
                    var image = value[i];
                    if (!image.imageUrl) return;
                    propertyValue += this._imageToString(image);
                }
            }
            var hasChange = this.value !== propertyValue;
            if (hasChange) {
                this._set("value", propertyValue);
                if (this._started && this.validate()) {
                    this.onChange(propertyValue);
                }
            }            
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
        }
    });
});
