define("app/ModuleInitializer",[
// Dojo
    "dojo",
    "dojo/_base/declare",
//CMS
    "epi/_Module",
   "epi/ModuleManager",
    "epi/routes"
], function (
// Dojo
    dojo,
    declare,
//CMS
    _Module,
    dependency,
    routes
) {

    return declare([_Module], {
        // summary: Module initializer for the default module.

        initialize: function () {

            this.inherited(arguments);

            var registry = this.resolveDependency("epi.storeregistry");

            //Register the EPiImage store
            registry.create("CMS7ImageStore", this._getRestPath("EPiImage"));
        },

        _getRestPath: function (name) {
            return routes.getRestPath({ moduleArea: "app", storeName: name });
        }
    });
});