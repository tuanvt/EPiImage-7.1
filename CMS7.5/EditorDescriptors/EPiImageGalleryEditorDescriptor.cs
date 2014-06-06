using System;
using System.Collections.Generic;
using EPiImage.CustomProperties;
using EPiServer.Shell.ObjectEditing.EditorDescriptors;

namespace EPiImage.EditorDescriptors
{
    [EditorDescriptorRegistration(TargetType = typeof(EPiImageGalleryImageCollection), UIHint = Constants.EPiImageGalleryUiHint)]
    public class EPiImageGalleryEditorDescriptor : EditorDescriptor
    {
        public override void ModifyMetadata(EPiServer.Shell.ObjectEditing.ExtendedMetadata metadata, IEnumerable<Attribute> attributes)
        {
            ClientEditingClass = "epiimage.editors.EPiImageGallery";

            base.ModifyMetadata(metadata, attributes);
        }
    }
}

