// Init
var img = new Image;
var faces = {};
let subscriptionKey = "8131ed9ae30443a9bc54c42d8c695cfe"
let endpoint = "https://face-crop-instance.cognitiveservices.azure.com" + '/face/v1.0/detect'
// let imageUrl = 'https://csdx.blob.core.windows.net/resources/Face/Images/detection1.jpg'

var canvas = document.getElementById('viewport');
var ctx = canvas.getContext('2d');
var canvasWidth = 600;
var canvasHeight = 300;
var blob = imgToBlob();
var dimensions = [];


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
    console.log()
    console.log(response.data)
    console.log("Top of face at "+response.data[0].faceRectangle.top)
    return response.data;
}).catch(function (error) {
    console.log(error)
});
};


// Application
var input = document.getElementById('input');
input.addEventListener('change', handleFiles);

var dimensions_input = document.getElementById('dimensions');
dimensions_input.addEventListener('keyup', setDimensions);
dimensions = dimensions_input.value.split(',');
function setDimensions() {
    dimensions = dimensions_input.value.split(',');
    //console.log(dimensions);
}


img.onload = function() {
    var canvasWidthNew = ((img.width > img.height) ? canvasWidth : canvasWidth * (img.width / img.height));
    var w = canvasWidthNew, h = canvasWidthNew*(img.height/img.width);
    /*var w = img.width, h = img.height;*/
    canvas.height = h;     
    canvas.width = w;  
    ctx.imageSmoothingEnabled = true; 
    ctx.drawImage(img, 0-0.5, 0-0.5, w, h);
    //var dataURL = canvas.toDataURL();
    blob = imgToBlob();
    faces = getFaces(blob);
};

function imgToBlob() {
    var dataUri = canvas.toDataURL('image/jpg');
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

function handleFiles(e) {
    //console.log(img);
    img.src = URL.createObjectURL(e.target.files[0]);
};

function exportImage(dim) {
    console.log("Starting " + dim);
    dim_x = dim.split("x")[0];
    dim_y = dim.split("x")[1];
    canvas.width = dim_x;
    canvas.height = dim_y;
    ctx.drawImage(img, 0-0.5, 0-0.5, dim_x, dim_y);
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    window.location.href=image; // it will save locally
}

function exportAll() {
    dimensions.forEach(dim => exportImage(dim));
    var zip = new JSZip();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// JSZip

var zip = new JSZip();
zip.file("Hello.txt", "Hello World\n");

var img = zip.folder("images");
img.file("smile.gif", imgData, {base64: true});
zip.generateAsync({type:"blob"})
.then(function(content) {
    // see FileSaver.js
    saveAs(content, "example.zip");
});