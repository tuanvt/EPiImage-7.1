using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Xml;
using EPiServer.Core;
using EPiServer.PlugIn;
using EPiServer.ServiceLocation;
using EPiServer.SpecializedProperties;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Formatting = Newtonsoft.Json.Formatting;

namespace CMS7Image.CustomProperties
{
    /// <summary>
    /// Custom PropertyData implementation
    /// </summary>
    [Serializable]
    [PropertyDefinitionTypePlugIn(DisplayName = "EPiImageGallery", Description = "Image gallery property with drag and drop add and sort")]
    public class EPiImageGalleryProperty : PropertyXhtmlString
    {
        private EPiImageGalleryImageCollection _value;
        private string _rawValue;


        /// <summary>
        /// Gets all the slides as a EPiImageGalleryImageCollection
        /// </summary>
        /// <returns></returns>
        public EPiImageGalleryImageCollection GetImages()
        {
            return this.Value != null ? _value : new EPiImageGalleryImageCollection();
        }

        /// <summary>
        /// LEGACY: Gets all the slides as a EPiImageGalleryImageCollection
        /// Consider using: GetImages() or Value
        /// </summary>
        /// <returns></returns>
        public EPiImageGalleryImageCollection GetImages(PageData currentPage)
        {
            return GetImages();
        }


        public override object Value
        {
            get
            {
                if (this.IsNull || this._value == null)
                {
                    return (object)null;
                }
                else
                {
                    return (object)this._value;
                }
            }
            set
            {
                this.SetPropertyValue(value, delegate
                {
                    var data = value as EPiImageGalleryImageCollection;
                    if (data != null && data.Count > 0)
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
            get { return typeof(EPiImageGalleryImageCollection); }
        }


        public override void LoadData(object newValue)
        {
            _rawValue = newValue as string;

            //Use PropertyXhtmlString to load the string value and do link mapping
            base.LoadData(newValue as string);
            string propertyValue = base.LongString;

            if (!String.IsNullOrEmpty(propertyValue) && propertyValue != "<p></p>")
            {
                if (propertyValue.StartsWith("<p>"))
                {
                    //2.x data format: Convert XHTML to Image Collection
                    this.Value = ConvertXhtmLtoImageCollection(propertyValue);
                }

            }
            else
                this.Value = new EPiImageGalleryImageCollection();
        }

        public override object SaveData(PropertyDataCollection properties)
        {
            //Use PropertyXhtmlString to save the string value and do link mapping
            this.LongString = ConvertImageCollectionToXhtml(this._value);

            return base.SaveData(properties);
        }


        //Used for debugging
        public string RawValue()
        {
            return _rawValue;
        }

        #region Public Methods ----------------------------------------------------------------------

        //ConvertXHTMLtoImageCollection
        public EPiImageGalleryImageCollection ConvertXhtmLtoImageCollection(string xhtml)
        {
            var collection = new EPiImageGalleryImageCollection();

            if (!String.IsNullOrEmpty(xhtml))
            {
                try
                {
                    //Extract images from XHTML
                    var xDoc = new XmlDocument();
                    xDoc.LoadXml(xhtml);
                    var images = xDoc.SelectNodes("/p/a");
                    foreach (XmlNode image in images)
                    {
                        if (image.FirstChild.Attributes == null) continue;
                        var src = HttpUtility.UrlDecode(image.FirstChild.Attributes["src"].Value);
                        var id = image.FirstChild.Attributes["id"].Value;
                        var alt = image.FirstChild.Attributes["alt"].Value.Replace("\"", "&quot;");
                        if (image.Attributes == null) continue;
                        var link = image.Attributes["href"].Value;
                        collection.Add(new EPiImageGalleryImage(id, src, alt, link));
                    }
                }
                catch (Exception e)
                {
                    //Log
                    log4net.ILog _log = log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);
                    _log.Error("ConvertXHTMLtoImageCollection Failed: value = " + xhtml + " Exception: " + e.Message);
                }
            }

            return collection;
        }


        //ConvertToXHTML
        public string ConvertImageCollectionToXhtml(EPiImageGalleryImageCollection collection)
        {
            var xml = new XmlDocument();
            var p = xml.CreateElement("p");
            xml.AppendChild(p);

            foreach (EPiImageGalleryImage image in collection)
            {
                var a = xml.CreateElement("a");
                a.SetAttribute("href", image.LinkUrl);
                var img = xml.CreateElement("img");
                img.SetAttribute("src", image.ImageUrl);
                img.SetAttribute("id", image.ImageId);
                img.SetAttribute("alt", image.Description);
                p.AppendChild(a);
                a.AppendChild(img);
            }

            return xml.OuterXml;
        }


        //ConvertJSONtoImageCollection
        public EPiImageGalleryImageCollection ConvertJsoNtoImageCollection(string json)
        {
            var colllection = new EPiImageGalleryImageCollection();
            var slides = json.Split('|');
            foreach (var slide in slides)
            {
                if (String.IsNullOrEmpty(slide)) continue;
                try
                {
                    var attr = JsonSerialize(slide);
                    colllection.Add(new EPiImageGalleryImage(attr[0], attr[1], attr[2], attr[3]));
                }
                catch (Exception e)
                {
                    //Log
                    var log = log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);
                    log.Error("ConvertJSONtoImageCollection Failed: value = " + json + " Exception: " + e.Message);
                }
            }


            return colllection;
        }

        //JsonSerialize
        private string[] JsonSerialize(string json)
        {
            if (!String.IsNullOrEmpty(json))
            {
                //Remove loading values
                json = json.Replace(",\"loading\":false", "").Replace(",\"loading\":true", "");

                var regex = new Regex("{\"id\":\"(?<ID>[a-z0-9\\-]*)\",\"url\":\"(?<URL>.*?)\",\"alt\":\"(?<ALT>.*)\",\"link\":\"(?<LINK>.*)\"}");
                var matchCollection = regex.Matches(json);
                foreach (Match match in matchCollection)
                {
                    return new string[] { match.Groups["ID"].Value, match.Groups["URL"].Value, match.Groups["ALT"].Value, match.Groups["LINK"].Value };
                }
            }
            return new string[0];
        }


        //ConvertImageGalleryToJSON
        public string ConvertImageGalleryToJson(EPiImageGalleryImageCollection collection)
        {
            string json = "";

            if (collection != null)
            {
                foreach (EPiImageGalleryImage image in collection)
                    json += "{\"id\":\"" + image.ImageId + "\",\"url\":\"" + image.ImageUrl + "\",\"alt\":\"" + image.Description + "\",\"link\":\"" + image.LinkUrl + "\"}|";
            }

            return json;
        }

        #endregion Public Methods -------------------------------------------------------------------


    }

    [Serializable]
    public class EPiImageGalleryImageCollection : IEnumerable
    {
        private readonly List<EPiImageGalleryImage> _collection;


        public EPiImageGalleryImageCollection()
        {
            _collection = new List<EPiImageGalleryImage>();
        }

        public EPiImageGalleryImageCollection(string serializedValue)
        {
            _collection = new List<EPiImageGalleryImage>();

            string[] images = serializedValue.Split('¤');
            foreach (string image in images)
            {
                if (!string.IsNullOrEmpty(image) && image.IndexOf('|') >= 0)
                    this.Add(new EPiImageGalleryImage(image));
            }
        }

        public void Add(EPiImageGalleryImage item)
        {
            _collection.Add(item);
        }

        //Count
        public int Count
        {
            get { return this._collection.Count; }
        }

        //IEnumerator and IEnumerable require these methods.
        public IEnumerator GetEnumerator()
        {
            return _collection.GetEnumerator();
        }


        //List
        public EPiImageGalleryImage this[int index]
        {
            get { return _collection[index]; }
            set
            {
                var image = value as EPiImageGalleryImage;
                if (image == null)
                {
                    throw new ArgumentException("Must be of type EPiImageGalleryImage");
                }
                _collection[index] = image;
            }
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("[");
            foreach (var galleryImage in _collection)
            {
                sb.Append('{');
                sb.Append(galleryImage.ToString());
                sb.Append('}');
            }
            sb.Append("]");
            return sb.ToString();
        }

    }
    [Serializable]
    public class EPiImageGalleryImage
    {
        public string ImageUrl { get; set; }
        public string Description { get; set; }
        public string ImageId { get; set; }
        public string LinkUrl { get; set; }

        public EPiImageGalleryImage(string serializedValue)
        {
            var values = serializedValue.Split('|');
            if (values.Length != 4) return;
            ImageUrl = values[0];
            Description = values[1];
            ImageId = values[2];
            LinkUrl = values[3];
        }

        public EPiImageGalleryImage(string slideID, string imageUrl, string description, string linkUrl)
        {
            ImageUrl = imageUrl;
            Description = description;
            ImageId = slideID;
            LinkUrl = linkUrl;
        }

        public override string ToString()
        {
            return string.Format("imageUrl={0},imageDescription={1},imageId={2},linkUrl={3}", ImageUrl, string.IsNullOrEmpty(Description) ? "\"\"" : Description, ImageId, string.IsNullOrEmpty(LinkUrl) ? "\"\"" : LinkUrl);
        }


    }

    /// <summary>
    /// Json converter that handles conversion between EPiImageGalleryImageCollectionConverter and string
    /// for the new EPiServer 7 UI
    /// </summary>
    [ServiceConfiguration(typeof(JsonConverter))]
    public class EPiImageGalleryImageCollectionJsonConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return typeof(EPiImageGalleryImageCollection).IsAssignableFrom(objectType);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.Value == null)
                return null;

            return new EPiImageGalleryImageCollection(reader.Value.ToString());
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var gallery = value as EPiImageGalleryImageCollection;
            if (gallery == null || gallery.Count == 0)
            {
                writer.WriteValue(string.Empty);
                return;
            }

            writer.WriteValue(RestLowercaseJsonSerializer.SerializeObject(gallery));
        }

    }

    public class RestLowercaseJsonSerializer
    {
        private static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            ContractResolver = new LowercaseContractResolver()
        };

        public static string SerializeObject(object o)
        {
            return JsonConvert.SerializeObject(o, Formatting.Indented, Settings);
        }

        public class LowercaseContractResolver : DefaultContractResolver
        {
            protected override string ResolvePropertyName(string propertyName)
            {
                return Char.ToLowerInvariant(propertyName[0]) + propertyName.Substring(1);
            }
        }
    }

}
