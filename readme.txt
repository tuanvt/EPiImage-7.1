Note: This is a side project that I do to help moving MakingWaves EPiImage property from CMS6 to work on CMS 7, hence all the properties values are still stayed on the same forward, just the editing controls are now dojo based instead of jquery.

The latest updates have available versions for both EPiServer 7.1 & EPiServer 7.5

Guide to setup the image property and image gallery 

1. First, add EPiImage.dll from [bin Folder] to your reference

2. Then copy the folder EPiImage under ClientResources to your ClientResources folder.

3. Modify your module.config to have the following things:

<?xml version="1.0" encoding="utf-8"?>
<module>
    <assemblies>
	    <!-- This adds the Alloy template assembly to the "default module" -->
        <add assembly="CMS75" />
        <add assembly="EPiImage" />
    </assemblies>
  
    <clientResources>
        <add name="epi-cms.widgets.base" path="Styles/Styles.css" resourceType="Style"/>
        <add name="epiimage.editors.style" path="Styles/imagegallery.css" resourceType="Style" />
    </clientResources>
    <dojo>
        <!-- Add a mapping from alloy to ~/ClientResources/Scripts to the dojo loader configuration -->
        <paths>
            <add name="app" path="Scripts" />
            <add name="epiimage" path="Scripts/EPiImage/" />
        </paths>
    </dojo>
  <clientModule initializer="app.ModuleInitializer">
    <requiredResources>
      <add name="epiimage.editors.style"/>
    </requiredResources>
  </clientModule>
</module>


1. Fist block,add assembly to generate the url for EpiImageStore, which is declared as a Rest Store, to get the file info from the server back to the client.

2. Second block, the client resources are for module initializer, and css that will be used for our properties.

3. Third block, the dojo module is to define the namespace for Scripts folder that will be used for EPI Image/Gallery client editor.


TO USE THE PROPERTY:

Example using the single image property:

		[Display(
            GroupName = SystemTabNames.Content,
            Order = 20)]
        [UIHint("EPiImage")]
        [BackingType(typeof(EPiImageProperty))]
        public virtual EPiImagePropertyData Image { get; set; }

Example using the image gallery property

		[UIHint(Constants.EPiImageGalleryUiHint)]
        [BackingType(typeof(EPiImageGalleryProperty))]
        [Display(
        GroupName = SystemTabNames.Content,
        Order = 20)]
		public virtual EPiImageGalleryImageCollection Images { get; set; }

The UIHint and BackingType are required for this to work.

A demo screencast of how properties work is at:

http://www.screencast.com/t/IPVCO5OmPtPU