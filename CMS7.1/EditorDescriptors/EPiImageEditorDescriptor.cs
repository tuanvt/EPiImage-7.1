using System;
using System.Collections.Generic;
using CMS7Image.CustomProperties;
using EPiServer.Shell.ObjectEditing.EditorDescriptors;

namespace CMS7Image.EditorDescriptors
{

    [EditorDescriptorRegistration(TargetType = typeof(EPiImagePropertyData), UIHint = Constants.EPiImageUiHint)]
    public class EPiImageEditorDescriptor : EditorDescriptor
    {
        public override void ModifyMetadata(EPiServer.Shell.ObjectEditing.ExtendedMetadata metadata, IEnumerable<Attribute> attributes)
        {
            ClientEditingClass = "epiimage.editors.EPiImage";

            base.ModifyMetadata(metadata, attributes);
        }
    }
}
