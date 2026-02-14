import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        //uploading file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'    //automatically detect the file type
        });
        // file has been uploaded successfully
        // console.log('File uploaded successfully.', response.url);
        fs.unlinkSync(localFilePath); //deleting the local file after uploading
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //deleting the local file in case of error
        return null;
    }
}
export { uploadOnCloudinary };