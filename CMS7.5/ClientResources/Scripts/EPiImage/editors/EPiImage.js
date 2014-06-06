define([
// dojo
    "dojo",
    "dojo/dom-construct",
    "dojo/mouse",
    "dojo/on",
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
    "dojo/dnd/Target",    
    "epi/routes",
    "epi/shell/TypeDescriptorManager",
    "epi/shell/widget/_ValueRequiredMixin",
    "epi/shell/widget/dialog/Dialog",

// epi.cms
    "epi-cms/core/ContentReference",    
    "epi-cms/contentediting/ContentActionSupport",
    //"epi-cms/widget/_Droppable",
    //"epi-cms/widget/_HasClearButton",
    "epi-cms/widget/_HasChildDialogMixin",
    "epi-cms/widget/ContentSelectorDialog",

// resources
    "dojo/text!./templates/EPiImage.html",
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
    Target,    
    routes,
    TypeDescriptorManager,
    _ValueRequiredMixin,
    Dialog,

// epi.cms
    ContentReference,    
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

    return declare("epiimage.editors.EPiImage", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin, /*_HasClearButton,*/ _HasChildDialogMixin, /*_Droppable,*/ _ValueRequiredMixin], {

        templateString: template,

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
        allowedTypes: ['episerver.core.icontentimage'],
        image:null,
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
        destroy: function () {

            if (this.dialog) {
                this.dialog.destroyRecursive();
                delete this.dialog;
            }

            this.inherited(arguments);

        },
        postCreate: function () {
            // summary:
            //      Overridden to initialize ui elements when no value is set.

            this.inherited(arguments);

            /*if (!this.value) {
                this._updateDisplayNode(null);                
            }*/
            //We need to set the label here
            if (!this.value) {
                this.btnCreate.set("label", "+ Add Image");
                domAttr.set(this.divThumb, "style", "display:none");
            }
            this.connect(this.btnCreate, "onClick", this._onButtonClick);            
        },     
        focus: function () {
            this.btnCreate.focus();
        },
        _setStateAttr: function (value) {
            this._set("state", value);          
        },
        _showEditDialog: function () {
            var self = this;
            var description = "";
            var linkUrl = "";
            var title = "";
            if (!this.dialog) {
                if (self.image) {
                    title = self.image.title;
                    description = self.image.description;
                    linkUrl = self.image.linkUrl;
                }
                var epiImageInfoForm = new EpiImageInfoForm({description: description, linkUrl: linkUrl, title: title });

                this.dialog = new BaseDialog({
                    title: "Edit Image",
                    content: epiImageInfoForm,
                    confirmActionText: "Save",
                });

                this.connect(this.dialog, 'onExecute', lang.hitch(this, function () {
                    var imageInfo = epiImageInfoForm.get("value");

                    if (imageInfo) {                        
                        self.image.title = imageInfo.title;
                        self.image.description = imageInfo.description;
                        self.image.linkUrl = imageInfo.linkUrl;
                        
                        self._setValue(self.image);
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
                this.image = value;
                this._setValue(this.image);                 
            }
        },        
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

                var valueAsContentReference;
                if (this.value) {
                    valueAsContentReference = this._convertValueToContentReference(this.value);
                }

                if (valueAsContentReference) {
                    valueAsContentReference = valueAsContentReference.createVersionUnspecificReference().toString();
                }

                this.contentSelectorDialog.set("value", valueAsContentReference);

                dialog.show();

            }));
        },
        _onDialogExecute: function () {
            //summary:
            //    Handle dialog close
            // tags:
            //    private
            var getValue = this.contentSelectorDialog.get('value');
            var self = this;
            if (!getValue) { return; }
            else {
                
                var registry = dependency.resolve("epi.storeregistry");
                when(registry.get("CMS7ImageStore").executeMethod("GetImageInfo", "", {
                    contentRefId: getValue
                }), lang.hitch(this, function (response) {
                    //set image source and value
                    if (response.statusResponse == "OK") {
                        self.image = { imageUrl: response.imageUrl };
                        this._setValue(self.image);
                        domAttr.set(this.lblError, "innerHTML", "");
                    } else {
                        domAttr.set(this.lblError, "innerHTML", response.statusResponse);
                    }
                }
                ));                                
            }

            //var value = this.contentSelectorDialog.get('value');
            //this._setValueAndFireOnChange(value);
        },
        viewImage: function (value) {
            var self = this;
            if (value) {
                domAttr.set(this.divThumb, "style", "display:inline-block");
                //create edit info button for each image
                var imgEditButton = new Button({
                    label: "Edit Info",
                    onClick: function() {
                        self._showEditDialog();
                    }
                });

                //create remove button for each image
                var imgRemoveButton = new Button({
                    label: "X",
                    onClick: function() {
                        self._removeImage();
                    }
                });

                dojo.addClass(imgRemoveButton.domNode, "remove-button");
                dojo.addClass(imgEditButton.domNode, "edit-button");


                domConstruct.place(imgEditButton.domNode, this.divThumb, "last");
                domConstruct.place(imgRemoveButton.domNode, this.divThumb, "last");

                // display buttons when hover the div
                on(this.divThumb, mouse.enter, function() {
                    domAttr.set(imgEditButton, "style", "display:block");
                    domAttr.set(imgRemoveButton, "style", "display:block");
                });

                on(this.divThumb, mouse.leave, function() {
                    domAttr.set(imgEditButton, "style", "display:none");
                    domAttr.set(imgRemoveButton, "style", "display:none");
                });
                domAttr.set(this.imgNode, "src", value.imageUrl || '');

                //alert(domAttr.get(node, "src"));                       
                this.btnCreate.set("label", "Edit Image ...");
            } else {
                //alert(domAttr.get(node, "src"));                      
                domAttr.set(this.divThumb, "style", "display:none");
                this.btnCreate.set("label", "+ Add Image");
            }
        },
        _convertValueToContentReference: function (value) {
            //summary:
            //
            // tags:
            //    private
            return new ContentReference(value);
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
        onChange: function (value) {
            // summary:
            //    Fired when value is changed.
            //
            // value:
            //    The value
            // tags:
            //    public, callback
        },
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
        _serializeImage: function (image) {
            // Return empty string for 
            if (!image.imageUrl || typeof image.imageUrl !== "string") {
                return "";
            }
            return ({ imageUrl: image.imageUrl, description: image.description,linkUrl: image.linkUrl, title: image.title });
        },
        hasChange: function (oldVal, newVal) {
            if (oldVal && newVal) {
                if (oldVal.imageUrl == newVal.imageUrl && oldVal.description == newVal.description && oldVal.linkUrl == newVal.linkUrl && oldVal.title == newVal.title) {
                    return false;
                }
            } else if (!oldVal && !newVal)
                return false;
            return true;
        },
        _setValue: function (value) {
            var propertyValue = "";
            if (value && value.imageUrl) {
                propertyValue = this._serializeImage(value);
            }
            this.viewImage(value);
            if (this.hasChange(this.value, value)) {
                this._set("value", propertyValue);
                if (this._started && this.validate()) {
                    this.onChange(propertyValue);
                }
            }
        },
        _removeImage: function () {            
            this.image = null;
            this._setValue(null);
        }
    });
});