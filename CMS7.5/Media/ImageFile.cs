using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using EPiServer.Core;
using EPiServer.DataAnnotations;
using EPiServer.Framework.Blobs;
using EPiServer.Framework.DataAnnotations;

namespace EPiImage.Media
{
    [ContentType(GUID = "0A89E464-56D4-449F-AEA8-2BF774AB8730")]
    [MediaDescriptor(ExtensionString = "jpg,jpeg,jpe,ico,gif,bmp,png")]
    public class ImageFile : ImageData
    {
        public const string MediumThumbnailPropName ="MediumThumbnail";
        private Blob _mediumThumbnail;
        /// <summary>
        /// Gets or sets the copyright.
        /// </summary>
        /// <value>
        /// The copyright.
        /// </value>
        public virtual string Copyright { get; set; }
        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        /// <value>
        /// The description.
        /// </value>
        public virtual string Description { get; set; }

        [ImageDescriptor(Height = 150, Width = 150)]
        [Editable(false)]
        public virtual Blob MediumThumbnail
        {
            get
            {
                return this._mediumThumbnail;
            }
            set
            {
                this.ThrowIfReadOnly();
                this._mediumThumbnail = value;
            }
        }
    }
}