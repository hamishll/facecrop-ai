// Init
var img = new Image;
var faces = {};
let subscriptionKey = "3a972893c60940b4816bb88af57e002b"
let endpoint = "https://face-crop-instance.cognitiveservices.azure.com" + '/face/v1.0/detect'
// let imageUrl = 'https://csdx.blob.core.windows.net/resources/Face/Images/detection1.jpg'

var canvas = document.getElementById('viewport');
var ctx = canvas.getContext('2d');
var canvasWidth = 800;
var canvasHeight = 500;
var blob = imgToBlob();
var dimensions = [];
var face_x_offset = 0;
var face_y_offset = 0;
var dummy_top = 20;
var dummy_center = 50;
var highestFace = 0;
var croppers = [];
var imageFormat = "png";
var filename = "crop";

//////////////////////////////////////////////////////////////////
// 0. Initialise Application
//////////////////////////////////////////////////////////////////
var input = document.getElementById('input');
input.addEventListener('change', handleFiles);

var dimensions_input = document.getElementById('dimensions');
dimensions_input.addEventListener('keyup', setDimensions);
dimensions = dimensions_input.value.split(',');

function setDimensions() {
    dimensions = dimensions_input.value.split(',');
    //console.log(dimensions);
}
var zip = new JSZip();
zip.file("LICENSE.md", "Created by hamishll\n");



//////////////////////////////////////////////////////////////////
// 1. Load files after file chosen
//////////////////////////////////////////////////////////////////

function handleFiles(e) {
    //console.log(img);
    img.src = URL.createObjectURL(e.target.files[0]);
    filename = e.target.files[0].name;
    //dimensions.forEach(item => renderImage(item.split("x")[0],item.split("x")[1]));
    dimensions.forEach(item => renderImage(item));
    //document.getElementById("image").src = img.src;
    
};

//////////////////////////////////////////////////////////////////
// 1.1 Load each cropper window after file chosen
//////////////////////////////////////////////////////////////////

function renderImage(item) {
    const cropperContainer = document.getElementById('croppercontainer');
    const newCropperChildContainer = document.createElement("div");
    newCropperChildContainer.classList.add("croppercont");
    const newCropperChild = document.createElement("img");
    newCropperChild.id = item;
    newCropperChild.src = img.src;
    newCropperChildContainer.appendChild(newCropperChild);
    cropperContainer.appendChild(newCropperChildContainer);
    // const image = document.getElementById('image'+item);
    croppers.push(new Cropper(document.getElementById(item), {viewMode: 1, autoCropArea: 1,
    aspectRatio: item.split("x")[0] / item.split("x")[1],
    crop(event) {
        console.log(event.detail.x);
        console.log(event.detail.y);
        console.log(event.detail.width);
        console.log(event.detail.height);
        console.log(event.detail.rotate);
        console.log(event.detail.scaleX);
        console.log(event.detail.scaleY);
    },
    }));
}
 
//////////////////////////////////////////////////////////////////
// 2. Face API call (note: need to limit this to run once probably)
//////////////////////////////////////////////////////////////////

img.onload = function() {
    //var dataURL = canvas.toDataURL();
    blob = imgToBlob();
    sourceWidth = img.width;
    sourceHeight = img.height;
    faces = getFaces(blob);
};
// Face API
function getFaces(blob) {
    axios({
    method: 'post',
    url: endpoint,
    params : {
		detectionModel: 'detection_02',
        returnFaceId: true
    },
    data: blob,
    //{
    //    url: imageUrl,
    //}
    //,
    headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type': 'application/octet-stream' }
}).then(function (response) {
    console.log('Status text: ' + response.status)
    console.log('Status text: ' + response.statusText)
    console.log(response.data)
    // console.log("Top of face at "+response.data[0].faceRectangle.top)
    parseFaces(response.data);
    return response.data;
}).catch(function (error) {
    console.log(error)
});
};

// Find centroid 
function parseFaces(faces) {
    highestFace = Math.min.apply(Math, faces.map(function(faces) { return faces.faceRectangle.top; }))
    centroid = mean(faces.map(function(faces) {return faces.faceRectangle.left}));
    console.log("The highest face is "+highestFace+" pixels from the top of the image");
    console.log("The central region of the image is "+centroid);
}


//////////////////////////////////////////////////////////////////
// 3. Export all images
//////////////////////////////////////////////////////////////////
function exportAll() {
    
    //dimensions.forEach(dim => exportImage(dim));
    croppers.forEach(item => exportCrop(item));
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        // see FileSaver.js
        saveAs(content, "Crops.zip");
    });
}
//////////////////////////////////////////////////////////////////
// 3.1. Export single crop (NEW)
//////////////////////////////////////////////////////////////////
function exportCrop(cropper) {
    var crop = cropper.getCroppedCanvas({width: cropper.element.id.split("x")[0], height: cropper.element.id.split("x")[1]});
    var imgUrl = crop.toDataURL();
    zip.file(filename+"_"+cropper.element.id+"."+imageFormat, imgUrl.split('base64,')[1],{base64: true});
};

//////////////////////////////////////////////////////////////////
// 3.1. Export single image
//////////////////////////////////////////////////////////////////

function exportImage(dim) {
    console.log("Starting " + dim);
    dim_x = dim.split("x")[0];
    dim_y = dim.split("x")[1];
    canvas.width = dim_x;
    canvas.height = dim_y;
    // face_x_offset = 2 * (dummy_center - sourceWidth/2);

    if (dim_x/dim_y > sourceWidth/sourceHeight) {
        ctx.drawImage(img, face_x_offset, (dim_y-dim_y*(sourceWidth/sourceHeight))/2, dim_x, dim_y*(sourceWidth/sourceHeight));
    }
    else {
        ctx.drawImage(img, (dim_x-dim_y*(sourceWidth/sourceHeight))/2, 0, dim_y*(sourceWidth/sourceHeight), dim_y);
    }
    
    //var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    var imgUrl = canvas.toDataURL();
    zip.file("crop_"+dim+"."+imageFormat, imgUrl.split('base64,')[1],{base64: true});
    
}

//////////////////////////////////////////////////////////////////
// X. Helper functions
//////////////////////////////////////////////////////////////////

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mean function
function mean(numbers) {
    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

// Not sure this is required any more
function imgToBlob() {
    var dataUri = canvas.toDataURL('image/'+imageFormat);
    var data = dataUri.split(',')[1];
    var mimeType = dataUri.split(';')[0].slice(5)

    var bytes = window.atob(data);
    var buf = new ArrayBuffer(bytes.length);
    var byteArr = new Uint8Array(buf);

    for (var i = 0; i < bytes.length; i++) {
        byteArr[i] = bytes.charCodeAt(i);
            }
    return byteArr;
}
