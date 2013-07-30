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
"epi/shell/widget/dialog/_DialogContentMixin",
"epi/shell/widget/dialog/Dialog",
"epi/shell/widget/_ActionProviderWidget",
"epi-cms/widget/UrlSelector",

// resources
"dojo/text!./templates/EPiImageInfoForm.html",
//Netcat app
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
    _DialogContentMixin,
    Dialog,
    _ActionProviderWidget,
    UrlSelector,

// resources
    template,
//Netcat app
appModule

    ) {

    return declare("epiimage.editors.EPiImageInfoForm", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _ActionProviderWidget, _DialogContentMixin, _HasChildDialogMixin, _ValueRequiredMixin], {
        templateString: template,
        imageId: null,
        description: null,
        linkUrl: null,
        postMixInProperties: function () {
            this.inherited(arguments);

            //            this.message = lang.replace(this.res.warningtext, {
            //                defaultname: this.defaultContentName
            //            });
            //            this._set("message", this.message);
            //            this.title = res.title;

        },
        postCreate: function () {
            this.inherited(arguments);
            if (this.description) {
                this.imageDescription.set("value", this.description);
            }
            if (this.linkUrl) {
                this.txtLinkUrl.value = this.linkUrl;
            }

            this.connect(this.btnLinkUrl, "onClick", this._showUrlDialog);

        },

        _showUrlDialog: function () {
            var self = this;
            //if (!this._dialog) {
                this._dialog = new UrlSelector();
                if (this.linkUrl) {
                    this._dialog.set("value", this.linkUrl);
                }
                this.connect(this._dialog, 'onHide', this._onHide);
                this.connect(this._dialog, 'getValueFromCallbackResult', lang.hitch(this, function (value) {
                    //var imageUrl = _dialog.get("value");
                    if (value.href) {
                        var linkUrl = value.href;
                        self.txtLinkUrl.value = linkUrl;
                    }
                }));

                this._dialog._showDialog();
            //}
        },

        _onHide: function () {
            this.isShowingChildDialog = false;
            this._dialog.destroyRecursive();
            delete this._dialog;
        },
        _getValueAttr: function () {
            return { imageId: this.imageId, description: this.imageDescription.value, linkUrl: this.txtLinkUrl.value };

        },
        onCancel: function () {
        }

    }
    );
});