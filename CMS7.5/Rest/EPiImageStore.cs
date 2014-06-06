using System;
using System.Web;
using EPiImage.Media;
using EPiServer;
using EPiServer.Core;
using EPiServer.ServiceLocation;
using EPiServer.Shell.Services.Rest;
using EPiServer.Web.Hosting;
using EPiServer.Web.Routing;


namespace EPiImage.Rest
{

    [RestStore("EPiImage")]
    public class EPiImageStore : RestControllerBase
    {
        public RestResult Get()
        {
            return Rest("");
        }

        public RestResult GetImageInfo(int contentRefId)
        {
            var contentRepository = ServiceLocator.Current.GetInstance<IContentRepository>();
            var statusResponse = "Error: Unspecified";
            var description = string.Empty;
            if (contentRefId < 1)
            {
                statusResponse = "Error: File cannot be found";
                return Rest(new { StatusResponse = statusResponse });
            }

            var imageContent = contentRepository.Get<IContent>(new ContentReference(contentRefId));

            if (imageContent == null)
            {
                statusResponse = "Error: " +
                                     EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorimagenotfound");
            }
            else
            {
                if (!(imageContent is IContentImage))
                {
                    statusResponse = "Error: " +
                                 EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorfiltypenotsupported");                    
                }
                else
                {
                    statusResponse = "OK";    
                    string imageUrl = ServiceLocator.Current.GetInstance<UrlResolver>().GetUrl(imageContent.ContentLink);
                    var file = imageContent as ImageFile;
                    if (file != null)
                    {
                        description = file.Description;
                    }
                    return Rest(new {StatusResponse = statusResponse, ImageUrl = imageUrl, Description = description});

                }                
            }
            return  Rest(new { StatusResponse = statusResponse });            
        }


        public RestResult GetGalleryImageInfo(int contentRefId)
        {
            var contentRepository = ServiceLocator.Current.GetInstance<IContentRepository>();
            var statusResponse = "Error: Unspecified";
            var description = string.Empty;
            if (contentRefId < 1)
            {
                statusResponse = "Error: File cannot be found";
                return Rest(new { StatusResponse = statusResponse });
            }

            var imageContent = contentRepository.Get<IContent>(new ContentReference(contentRefId));

            if (imageContent == null)
            {
                statusResponse = "Error: " +
                                     EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorimagenotfound");
            }
            else
            {
                if (!(imageContent is IContentImage))
                {
                    statusResponse = "Error: " +
                                 EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorfiltypenotsupported");
                }
                else
                {
                    statusResponse = "OK";
                    string imageUrl = ServiceLocator.Current.GetInstance<UrlResolver>().GetUrl(imageContent.ContentLink);
                    var file = imageContent as ImageFile;
                    if (file != null)
                    {
                        description = file.Description;
                    }
                    return Rest(new { StatusResponse = statusResponse, ImageUrl = imageUrl, Description = description, ImageId = Guid.NewGuid().ToString() });

                }
            }
            return Rest(new { StatusResponse = statusResponse });    
        }

    }
}