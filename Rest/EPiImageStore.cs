using System;
using System.Web;
using EPiServer.Shell.Services.Rest;
using EPiServer.Web.Hosting;

namespace CMS7Image.Rest
{

    [RestStore("EPiImage")]
    public class EPiImageStore : RestControllerBase
    {
        public RestResult Get()
        {
            return Rest("");
        }

        public RestResult GetImageInfo(string imagePath)
        {
            var statusResponse = "Error: Unspecified";
            UnifiedFile file = null;
            if (string.IsNullOrEmpty(imagePath))
            {
                statusResponse = "Error: file name can not be empty";
                return Rest(new { StatusResponse = statusResponse });
            }
            imagePath = HttpUtility.UrlDecode(imagePath);

            imagePath = imagePath.Trim();

            //Check if a JPG or a GIF or a PNG
            if (imagePath.ToLower().EndsWith(".jpg") || imagePath.ToLower().EndsWith(".jpeg") ||
                imagePath.ToLower().EndsWith(".gif") || imagePath.ToLower().EndsWith(".png"))
            {
                //Check that the source file exists
                if (GenericHostingEnvironment.VirtualPathProvider.FileExists(imagePath))
                {
                    //Create thumb and preview image
                    file = GenericHostingEnvironment.VirtualPathProvider.GetFile(imagePath) as UnifiedFile;

                    statusResponse = "OK";
                }
                else
                    statusResponse = "Error: " +
                                     EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorimagenotfound/");
            }
            else
                statusResponse = "Error: " +
                                 EPiServer.Framework.Localization.LocalizationService.Current.GetString("/epiimage/errorfiltypenotsupported/");
            return file != null ? Rest(new { StatusResponse = statusResponse, ImageUrl = file.VirtualPath, Description = file.Summary.Dictionary["Description"] }) : Rest(new { StatusResponse = statusResponse });
        }


        public RestResult GetGalleryImageInfo(string imagePath)
        {
            var statusResponse = "Error: Unspecified";
            UnifiedFile file = null;
            if (string.IsNullOrEmpty(imagePath))
            {
                statusResponse = "Error: file name can not be empty";
                return Rest(new { StatusResponse = statusResponse });
            }
            imagePath = HttpUtility.UrlDecode(imagePath);

            imagePath = imagePath.Trim();

            //Check if a JPG or a GIF or a PNG
            if (imagePath.ToLower().EndsWith(".jpg") || imagePath.ToLower().EndsWith(".jpeg") ||
                imagePath.ToLower().EndsWith(".gif") || imagePath.ToLower().EndsWith(".png"))
            {
                //Check that the source file exists
                if (GenericHostingEnvironment.VirtualPathProvider.FileExists(imagePath))
                {
                    //Create thumb and preview image
                    file = GenericHostingEnvironment.VirtualPathProvider.GetFile(imagePath) as UnifiedFile;

                    statusResponse = "OK";
                }
                else
                    statusResponse = "Error: " +
                                     EPiServer.Framework.Localization.LocalizationService.Current.GetString("/netcatimage/errorimagenotfound/");
            }
            else
                statusResponse = "Error: " +
                                 EPiServer.Framework.Localization.LocalizationService.Current.GetString("/netcatimage/errorfiltypenotsupported/");
            return file != null ? Rest(new
            {
                StatusResponse = statusResponse,
                ImageUrl = file.VirtualPath,
                Description = file.Summary.Dictionary["Description"]
                ,
                ImageId = Guid.NewGuid().ToString()
            }

                ) :
                Rest(new { StatusResponse = statusResponse });
        }

    }
}