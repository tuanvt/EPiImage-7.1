define("epiimage/editors/EpiImageInfoForm", [
// dojo
"dojo",
"dojo/_base/declare",
"dojo/_base/lang",
"dojo/_base/Deferred",
"dojo/dom-attr",
"dojo/json",

// dijit
"dijit/_Widget",
"dijit/_TemplatedMixin",
"dijit/_WidgetsInTemplateMixin",
"dijit/form/Button",
"dijit/form/TextBox",
"dijit/form/Textarea",

// epi.shell
"epi/dependency",
"epi/shell/dnd/Target",
"epi/routes",
// epi.cms
"epi-cms/widget/_HasChildDialogMixin",
"epi/shell/widget/_ValueRequiredMixin",
"epi-cms/widget/LinkEditor",
"epi-cms/contentediting/command/_CommandWithDialogMixin",

// resources
"dojo/text!./templates/EPiImageInfoForm.html",
// app
"app/RequireModule!App"
],
function (
// dojo
    dojo,
    declare,
    lang,
    Deferred,
    domAttr,
    JSON,

// dijit
    _Widget,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Button,
    TextBox,
    Textarea,

// epi.shell
    dependency,
    Target,
    routes,
// epi.cms
    _HasChildDialogMixin,
    _ValueRequiredMixin,
    LinkEditor,
    _CommandWithDialogMixin,

// resources
    template,
// app
appModule

    ) {

    return declare("epiimage.editors.EPiImageInfoForm", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _HasChildDialogMixin, _ValueRequiredMixin, _CommandWithDialogMixin], {
        templateString: template,
        imageId: null,
        description: null,
        linkUrl: null,
        title: null,
        dialogContentParams: null,
        dialogContentClass:LinkEditor,
        postMixInProperties: function () {
            this.inherited(arguments);

            //            this.message = lang.replace(this.res.warningtext, {
            //                defaultname: this.defaultContentName
            //            });
            //            this._set("message", this.message);
            //            this.title = res.title;
            this.dialogContentParams = {
                modelType: "EPiServer.Cms.Shell.UI.ObjectEditing.InternalMetadata.LinkModel",
                hiddenFields: ["text", "title", "target"]
            };

        },
        postCreate: function () {
            this.inherited(arguments);
            if (this.description) {
                this.imageDescription.set("value", this.description);
            }
            if (this.linkUrl) {
                this.txtLinkUrl.value = this.linkUrl;
            }
            if (this.title) {
                this.imageTitle.value =this.title;
            }
            this.connect(this.btnLinkUrl, "onClick", this._showUrlDialog);

        },

        _showUrlDialog: function () {
            this.showDialog();
            if (this.linkUrl) {
                this._dialog.set("value", this.linkUrl);
            }
        },

        onDialogHideComplete: function () {
            this.isShowingChildDialog = false;
            this._dialog.destroyRecursive();
            delete this._dialog;
        },
        onDialogExecute: function () {
           this.inherited(arguments);

            if (this.dialogContent) {
                if (this.parent) {
                    this.parent.editing = true; // in order to make auto-save works
                }
                var linkValue = this.dialogContent.get('value');
                if (linkValue) {
                    this.txtLinkUrl.value = linkValue.href;
                }               
            }
        },

        _getValueAttr: function () {
            return { imageId: this.imageId, description: this.imageDescription.value, linkUrl: this.txtLinkUrl.value, title: this.imageTitle.value };

        },
        onCancel: function () {
        }

    }
    );
});