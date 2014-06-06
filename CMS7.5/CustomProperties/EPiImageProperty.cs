using System;
using System.Web;
using System.Web.Mvc;
using System.Web.UI.HtmlControls;
using System.Xml;
using EPiServer.Core;
using EPiServer.Framework.DataAnnotations;
using EPiServer.PlugIn;
using EPiServer.Web;

namespace EPiImage.CustomProperties
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
                if (propertyData != null && propertyData.Description != null)
                    return propertyData.Description;
                else
                    return String.Empty;
            }
        }

        /// <summary>
        /// Returns the image title
        /// </summary>
        /// <returns></returns>
        public string ImageTitle
        {
            get
            {
                var propertyData = this.Value as EPiImagePropertyData;
                if (propertyData != null && propertyData.Title != null)
                    return propertyData.Title;
                else
                    return String.Empty;
            }
        }

        /// <summary>
        /// Returns the image title
        /// </summary>
        /// <returns></returns>
        public string ImageLinkUrl
        {
            get
            {
                var propertyData = this.Value as EPiImagePropertyData;
                if (propertyData != null && propertyData.LinkUrl != null)
                    return propertyData.LinkUrl;
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
               var xml = new XmlDocument();
                var img = xml.CreateElement("img");
                img.SetAttribute("src", data.ImageUrl);
                img.SetAttribute("alt", data.Description);
                img.SetAttribute("title", data.Title);
                if (!string.IsNullOrEmpty(data.LinkUrl))
                {
                    var a = xml.CreateElement("a");
                    a.SetAttribute("href", data.LinkUrl);
                    xml.AppendChild(a);
                    a.AppendChild(img);
                }
                else
                {
                    xml.AppendChild(img);
                }
                return xml.OuterXml;
            }
            return String.Empty;
        }

        protected EPiImagePropertyData DeserializeValue(string value)
        {            
            var xDoc = new XmlDocument();
            xDoc.LoadXml(value);
            var linkNode = xDoc.SelectNodes("/a");
            if(linkNode !=null && linkNode.Count > 0)
            {
                if (linkNode[0].FirstChild.Attributes == null) return null;

                var src = HttpUtility.UrlDecode(linkNode[0].FirstChild.Attributes["src"].Value);
                var alt = linkNode[0].FirstChild.Attributes["alt"].Value.Replace("\"", "&quot;");
                var title = linkNode[0].FirstChild.Attributes["title"].Value.Replace("\"", "&quot;");
                var link = linkNode[0].Attributes != null?linkNode[0].Attributes["href"].Value:string.Empty;
                return new EPiImagePropertyData(title, src, alt, link);
            }
            else
            {
                var imageNode = xDoc.SelectNodes("/img");
                if (imageNode != null && imageNode.Count > 0)
                {
                    if (imageNode[0].Attributes == null) return null;

                    var src = HttpUtility.UrlDecode(imageNode[0].Attributes["src"].Value);
                    var alt = imageNode[0].Attributes["alt"].Value.Replace("\"", "&quot;");
                    var title = imageNode[0].Attributes["title"].Value.Replace("\"", "&quot;");
                    
                    return new EPiImagePropertyData(title, src, alt, string.Empty);
                }
            }
            return null;
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
   }

    [Serializable]
    public class EPiImagePropertyData
    {        
        public string Title { get; set; }
        public string ImageUrl { get; set; }
        public string Description { get; set; }
        public string LinkUrl { get; set; }

        public EPiImagePropertyData(string imageTitle, string imageUrl, string imageDescription, string imageLinkUrl)
        {
            this.Title = imageTitle;
            this.ImageUrl = imageUrl;
            this.Description = imageDescription;
            this.LinkUrl = imageLinkUrl;
        }

        public override string ToString()
        {
            return ImageUrl;
        }
    }
}
