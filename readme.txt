Guide to setup the image property and image gallery 

1. First, add CMS7Image.dll to your reference

2. Then copy the folder EPiImage under ClientResources to your ClientResources folder.

3. Modify your module.config to have the following things:

<assemblies>

	<add assembly="CMS7Image" />
</assemblies>
  

<dojoModules>
    
	<add name="epiimage" path="EPiImage/Scripts" />
  
</dojoModules>
  
<clientResources>
    
	<add name="epi.cms.widgets.base" path="EPiImage/Scripts/ModuleInitializer.js" resourceType="Script" />
    
	<add name="epi.cms.widgets.base" path="EPiImage/Scripts/RequireModule.js" resourceType="Script" />
    	<add name="epiimage.editors.style" path="~/ClientResources/EPiImage/Css/imagegallery.css" resourceType="Style" />
  
</clientResources>
  

<clientModule initializer="epiimage.ModuleInitializer">
    
	<requiredResources>
      
		<add name="epiimage.editors.style"/>
    
	</requiredResources>
  
</clientModule>

Fist block,add assembly to generate the url for EpiImageStore, which is declared as a Rest Store, to get the file info from the server back to the client.

Second block, the dojo module is to define the namespace for Scripts folder that will be used for EPI Image/Gallery client editor.

Third block, the client resources are for module initializer, and css that will be used for our properties.




