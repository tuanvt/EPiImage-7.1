using System;
using System.Web;
using EPiServer.Core;
using EPiServer.Framework.DataAnnotations;
using EPiServer.PlugIn;
using EPiServer.Web;

namespace CMS7Image.CustomProperties
{
    /// <summary>
    /// Custom PropertyData implementation
    /// </summary>
    /// <summary>
    /// Custom PropertyData implementation
    /// </summary>
    [EditorHint(Constants.EPiImageUiHint)]
    [Serializable]
    [PropertyDefinitionTypePlugIn(DisplayName = "EPiImage", Description = "Image property w/preview and alt text")]
    public class EPiImageProperty : PropertyLongString
    {
        private EPiImagePropertyData _value;
        private const string ImgStart = "<img src=\"";
        private const string ImgEnd = "\" />";
        // TODO: Override members of EPiServer.Core.PropertyLongString to provide your own logic.

        /// <summary>
        /// Returns the url to the image
        /// </summary>
        /// <returns></returns>
        public string ImageUrl
        {
            get
            {
                var propertyData = this.Value as EPiImagePropertyData;
                if (propertyData != null && propertyData.ImageUrl != null)
                    return propertyData.ImageUrl;
                else
                    return String.Empty;
            }
        }

        /// <summary>
        /// Returns the image description
        /// </summary>
        /// <returns></returns>
        public string ImageDescription
        {
            get
            {
                var propertyData = this.Value as EPiImagePropertyData;
                if (propertyData != null && propertyData.ImageDescription != null)
                    return propertyData.ImageDescription;
                else
                    return String.Empty;
            }
        }

        public override object Value
        {
            get
            {
                if (this.IsNull || this._value == null)
                    return (object)null;
                else
                {
                    return (object)this._value;
                }
            }
            set
            {
                this.SetPropertyValue(value, delegate
                {
                    var data = value as EPiImagePropertyData;
                    if (data != null && !String.IsNullOrEmpty(data.ImageUrl))
                    {
                        this._value = data;

                        this.Modified();
                    }
                    else
                        this.Clear();

                });
            }
        }

        public override Type PropertyValueType
        {
            get { return typeof(EPiImagePropertyData); }
        }

        public override void LoadData(object newValue)
        {
            this.Value = this.DeserializeValue(newValue as string);
        }

        public override object SaveData(PropertyDataCollection properties)
        {
            return this.SerializeValue(this._value);
        }

        protected string SerializeValue(EPiImagePropertyData value)
        {
            var data = value;
            if (data != null && !String.IsNullOrEmpty(data.ImageUrl))
            {
                //Add <a href="{string}"></a> around string to trigger error message when deleting image
                if (!String.IsNullOrEmpty(data.ImageDescription))
                    return ImgStart + ToMappedLink(data.ImageUrl) + "?alt=" + data.ImageDescription + ImgEnd;
                else
                    return ImgStart + ToMappedLink(data.ImageUrl) + ImgEnd;
            }
            return String.Empty;
        }

        protected EPiImagePropertyData DeserializeValue(string value)
        {
            //Remove link around string <a href="{string}"></a>
            if (value.StartsWith(ImgStart))
                value = value.Replace(ImgStart, "");
            if (value.EndsWith(ImgEnd))
                value = value.Replace(ImgEnd, "");

            return new EPiImagePropertyData(DeserializeImageUrl(value), DeserializeImageDescription(value));
        }

        private static string DeserializeImageUrl(string value)
        {
            if (!String.IsNullOrEmpty(value))
            {
                if (value.IndexOf("?", System.StringComparison.Ordinal) != -1)
                    return HttpUtility.UrlDecode(FromMappedLink(HttpUtility.UrlDecode(value.Substring(0, value.IndexOf("?", System.StringComparison.Ordinal)))));
                else
                    return HttpUtility.UrlDecode(FromMappedLink(value));
            }

            return String.Empty;
        }

        private static string DeserializeImageDescription(string value)
        {
            if (!String.IsNullOrEmpty(value))
            {
                if (value.IndexOf("?alt=", System.StringComparison.Ordinal) != -1)
                {
                    string alt = value.Substring(value.IndexOf("?", System.StringComparison.Ordinal));
                    alt = alt.Replace("?alt=", "");
                    return HttpUtility.UrlDecode(alt);
                }
            }
            return String.Empty;
        }

        public override PropertyData ParseToObject(string value)
        {
            var newProperty = new EPiImageProperty();
            newProperty.LoadData(value);
            return newProperty;
        }

        public override void ParseToSelf(string value)
        {
            this.Value = PropertyString.Parse(value).Value;
        }

        public string ToParsableString()
        {
            return SerializeValue(this._value);
        }

        public override string ToString()
        {
            return ImageUrl;
        }


        public static string ToMappedLink(string url)
        {
            if (!string.IsNullOrEmpty(url))
            {
                string str;
                if (PermanentLinkMapStore.TryToPermanent(url, out str))
                {
                    return str;
                }
            }
            return url;
        }

        public static string FromMappedLink(string url)
        {
            string str2;
            return PermanentLinkMapStore.TryToMapped(url, out str2) ? str2 : url;
        }


    }

    [Serializable]
    public class EPiImagePropertyData
    {
        private const string ImgStart = "<img src=\"";
        private const string ImgEnd = "\" />";

        public string ImageUrl { get; set; }
        public string ImageDescription { get; set; }

        public EPiImagePropertyData(string imageUrl, string imageDescription)
        {
            this.ImageUrl = imageUrl;
            this.ImageDescription = imageDescription;
        }

        public override string ToString()
        {
            return ImageUrl;
        }
    }
}
