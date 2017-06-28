// Test index.handler.
var image_process = require("./index");

var event = {
    queryParameters: {
        url: "http://upload.mcchina.com/2014/0721/1405918321360.jpg",
        result: "image" // "redirect", "json"
    }
};

var context = {
    "credentials": {
        "accessKeyId": null,
        "accessKeySecret": null,
        "securityToken": null
    }
};
var callback = function (error, result) {
    console.error(error)
    console.log(result)
};

image_process.handler(new Buffer(JSON.stringify(event)), context, callback)
