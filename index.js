var cv = require('opencv');
var util = require('util');
var request = require('request').defaults({
    encoding: null
});
var uuid = require('node-uuid');
var oss = require('ali-oss').Wrapper;
var fs = require("fs")

var dstBucket = 'fc-album-public'; // Change this to your own bucket which should have public read access
var dstPrefix = 'tmp/';
var outputDomain = dstBucket + '.oss-cn-shanghai.aliyuncs.com';
var tmpPath = '/tmp/face-detection.jpeg';

function getFormattedDate() {
    var now = new Date().toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
    var formattedNow = now.substr(0, 4) + now.substr(5, 2) + now.substr(8, 2) +
        now.substr(11, 2) + now.substr(14, 2) + now.substr(17, 2);
    return formattedNow;
}

function getError(code, err) {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return {
        isBase64Encoded: false,
        statusCode: code,
        body: {
            message: err.message // JSON.stringify(err, Object.getOwnPropertyNames(err))
        }
    };
}

exports.handler = (eventBuf, ctx, callback) => {
    var event = JSON.parse(eventBuf);
    var imageUrl = null;
    var resultType = "json"; // Also supports "image", "redirect"
    console.log("Reading options from event:\n", util.inspect(event, {
        depth: 5
    }));
    if (event.queryParameters !== null && event.queryParameters !== undefined) {
        if (event.queryParameters.url !== undefined && event.queryParameters.url !== null && event.queryParameters.url !== "") {
            console.log("Received url: " + event.queryParameters.url);
            imageUrl = event.queryParameters.url;
        }
        if (event.queryParameters.result !== undefined && event.queryParameters.result !== null && event.queryParameters.result !== "") {
            console.log("Received result: " + event.queryParameters.result);
            resultType = event.queryParameters.result;
        }
    }
    if (imageUrl == null) {
        callback(null, getError(400, new Error("url is required")));
        return;
    }
    var response = {
        isBase64Encoded: false,
        statusCode: 500,
        headers: {},
        body: null
    };
    request.get(imageUrl, function (err, res, body) {
        if (err) {
            callback(null, getError(res.statusCode, err));
            return;
        }
        cv.readImage(body, function (err, im) {
            if (err) {
                callback(null, getError(500, err));
                return;
            }
            if (im.width() < 1 || im.height() < 1) {
                callback(null, getError(400, new Error("image has no size")));
                return;
            }
            im.detectObject("/code/node_modules/opencv/data/haarcascade_frontalface_alt.xml", {}, function (err, faces) {
                if (err) {
                    callback(null, getError(500, err));
                    return;
                }
                for (var i = 0; i < faces.length; i++) {
                    var face = faces[i];
                    im.rectangle([face.x, face.y], [face.width, face.height], [255, 255, 255], 2);
                }
                if (faces.length > 0) {
                    var dstKey = dstPrefix + getFormattedDate() + '-' + uuid.v4() + '.jpg';
                    if (resultType == "image") {
                        im.save(tmpPath);
                        fs.readFile(tmpPath, (err, data) => {
                            if (err) {
                                callback(null, getError(500, err));
                                return;
                            }
                            response['isBase64Encoded'] = true;
                            response['statusCode'] = 200;
                            response['body'] = data.toString('base64');
                            callback(null, response);
                            return;
                        });
                        return;
                    }
                    var contentType = 'image/jpeg';
                    // Create oss client.
                    var client = new oss({
                        region: "oss-cn-shanghai",
                        // Credentials can be retrieved from context
                        accessKeyId: ctx.credentials.accessKeyId,
                        accessKeySecret: ctx.credentials.accessKeySecret,
                        stsToken: ctx.credentials.securityToken
                    });
                    client.useBucket(dstBucket);
                    client.put(dstKey, im.toBuffer()).then(function (val) {
                        outputUrl = 'https://' + outputDomain + '/' + dstKey;
                        if (resultType == "redirect") {
                            response['statusCode'] = 303;
                            response['headers']['Location'] = outputUrl;
                            response['headers']['x-faces'] = faces.length;
                        } else if (resultType == "json") {
                            response['statusCode'] = 200
                            response['body'] = {
                                faces: faces.length,
                                outputUrl: outputUrl
                            };
                        }
                        console.log("response: " + JSON.stringify(response));
                        callback(null, response);
                        return;
                    }).catch(function (err) {
                        callback(null, getError(500, err));
                        return
                    });
                } else {
                    if (resultType == null || resultType == "redirect") {
                        response['statusCode'] = 303;
                        response['headers']['Location'] = imageUrl;
                    } else if (resultType == "json") {
                        response['statusCode'] = 200;
                        response['body'] = {
                            faces: 0,
                            outputUrl: imageUrl
                        };
                    }
                    console.log("response (no detection): " + JSON.stringify(response));
                    callback(null, response);
                }
            });
        });
    });
}
