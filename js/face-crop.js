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
var dimensions_object = {};
var face_x_offset = 0;
var face_y_offset = 0;
var dummy_top = 20;
var dummy_center = 50;
var highestFace = 0;
var croppers = [];
var imageFormat = "png";
var filename = "crop";
var dimension_id = "";
var uid = 1;
var quality = 0.7;
var fileSizeLimit = 200000 * 0.90;
var counter = 0;


//////////////////////////////////////////////////////////////////
// 0. Initialise Application
//////////////////////////////////////////////////////////////////
var input = document.getElementById('input');
input.addEventListener('change', handleFiles);

var loadingbar = document.getElementById('loadingbar');
var wheel = document.getElementById('wheel');


var slider = document.getElementById('quality');
var slidervalue = document.getElementById('qualityvalue');
slider.addEventListener('input', () => {fileSizeLimit = slider.value *0.90*1000 ; slidervalue.innerHTML = slider.value});

var dimensions_input = document.querySelectorAll('.dimension_box');
dimensions_input.forEach(item => item.addEventListener('keyup', setDimensions));
//dimensions_input.addEventListener('keyup', setDimensions);
// dimensions = dimensions_input.value.split(',');

function setDimensions() {
    dimensions = [];
    dimensions_input.forEach(item => {
        dimension_id = item.id;
        item.value.split(',').forEach(d => {
            dimensions.push({x : d.split('x')[0], y : d.split('x')[1], type : dimension_id});
        })
    });
    console.log(dimensions);
}
setDimensions();

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
    // Locate the container for all the cropper windows
    const cropperContainer = document.getElementById('croppercontainer');

    //Create the container for a single cropper window (to include heading and cropper img)
    const newCropperChildContainer = document.createElement("div");
    newCropperChildContainer.textContent = item.x + "x" + item.y + "_" + item.type;
    newCropperChildContainer.classList.add("croppercont");

    //Create the container for just the cropper img
    const newCropperChildContain = document.createElement("div");

    const newCropperChild = document.createElement("img");
    newCropperChild.id = item.x + "x" + item.y + "x" + item.type;
    newCropperChild.src = img.src;
    newCropperChildContain.appendChild(newCropperChild);
    newCropperChildContainer.appendChild(newCropperChild);
    cropperContainer.appendChild(newCropperChildContainer);
    // const image = document.getElementById('image'+item);
    croppers.push(new Cropper(document.getElementById(item.x + "x" + item.y + "x" + item.type), {viewMode: 0, autoCropArea: 1,
    aspectRatio: item.x / item.y,
    crop(event) {
        // console.log(event.detail.x);
        // console.log(event.detail.y);
        // console.log(event.detail.width);
        // console.log(event.detail.height);
        // console.log(event.detail.rotate);
        // console.log(event.detail.scaleX);
        // console.log(event.detail.scaleY);
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
    //Deactivating the face API call
    //faces = getFaces(blob);
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
    loadingbar.style.opacity = 1;
    //dimensions.forEach(dim => exportImage(dim));
    counter = 0;
    croppers.forEach(item => setTimeout(exportCrop(item),100));
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        // see FileSaver.js
        saveAs(content, "crops_" + filename + ".zip");
    });
    counter = 0;
    wheel.style.animation = "";
}
//////////////////////////////////////////////////////////////////
// 3.1. Export single crop (NEW)
//////////////////////////////////////////////////////////////////
var scalefactor = 1;
function exportCrop(cropper) {
    switch(cropper.element.id.split("x")[2]) {
        case "CRM":
            //console.log("Case CRM");
            scalefactor = 2;
            imageFormat = "jpeg";
            break;
            
        case "Social":
            //console.log("Case Social");
            scalefactor = 2;
            imageFormat = "png";
            break;

        case "Web":
            //console.log("Case Website");
            scalefactor = 1;
            imageFormat = "jpeg";
            break;

    }
    var crop = cropper.getCroppedCanvas({width: cropper.element.id.split("x")[0] * scalefactor, height: cropper.element.id.split("x")[1] * scalefactor});
    // var imgUrl = crop.toDataURL('image/'+imageFormat, quality);
    // var overhead = returnDataURLsize(imgUrl)/fileSizeLimit;
    // console.log("Size: " + returnDataURLsize(imgUrl) + ", Ratio: " + overhead);
    var overhead = 1;
    if (cropper.element.id.split("x")[2] != "Social") {
        for (var i = 20; i>0; i--) {
            //if (overhead > 1) {
                quality = quality/((overhead+9)/10);
                var imgUrl = crop.toDataURL('image/'+imageFormat, quality);
                overhead = returnDataURLsize(imgUrl)/fileSizeLimit;
                console.log("Quality: " + quality + ", Size: " + returnDataURLsize(imgUrl) + ", Overhead: " + overhead);
            //}
        }
    }
    else {
        var imgUrl = crop.toDataURL('image/'+imageFormat, quality);
    }
    
    zip.file(filename.slice(0,-4)+"_"+cropper.element.id+(scalefactor == 2 ? "@2x" : "")+"."+imageFormat, imgUrl.split('base64,')[1],{base64: true});
    console.log(filename.slice(0,-4)+"_"+cropper.element.id+(scalefactor == 2 ? "@2x" : "")+"."+imageFormat);
    counter++;
    loadingbar.innerText = "" + counter + " of " + dimensions.length + " complete";
    console.log("" + counter + " of " + dimensions.length + " complete");
};

//////////////////////////////////////////////////////////////////
// 3.1. Export single image
//////////////////////////////////////////////////////////////////

// function exportImage(dim) {
//     console.log("Starting " + dim);
//     dim_x = dim.split("x")[0];
//     dim_y = dim.split("x")[1];
//     canvas.width = dim_x;
//     canvas.height = dim_y;
//     // face_x_offset = 2 * (dummy_center - sourceWidth/2);

//     if (dim_x/dim_y > sourceWidth/sourceHeight) {
//         ctx.drawImage(img, face_x_offset, (dim_y-dim_y*(sourceWidth/sourceHeight))/2, dim_x, dim_y*(sourceWidth/sourceHeight));
//     }
//     else {
//         ctx.drawImage(img, (dim_x-dim_y*(sourceWidth/sourceHeight))/2, 0, dim_y*(sourceWidth/sourceHeight), dim_y);
//     }
    
//     //var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
//     var imgUrl = canvas.toDataURL();
//     zip.file("crop_"+dim+"."+imageFormat, imgUrl.split('base64,')[1],{base64: true});
    
// }

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

function returnDataURLsize(data) {
    var content_without_mime = data.split(",")[1];
    return window.atob(content_without_mime).length;
}