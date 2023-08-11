import {v2 as cloudinary} from 'cloudinary';
cloudinary.config({
  cloud_name: 'kienquan',
  api_key: '739882631216414',
  api_secret: '-yvHItCxi7a2earglR1x42e2p4w'
});

const image = './path/to/image.jpg'; // Can be a remote URL or base64 DataURI
// const result = await cloudinary.uploader.upload(image);

cloudinary.v2.uploader
.upload("/img/cmnd.jpg")
.then(result=>console.log(result));