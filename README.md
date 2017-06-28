OpenCV template for Aliyun FunctionCompute
=======
This project makes it easy to write [FunctionCompute](https://www.aliyun.com/product/fc) functions relying on [OpenCV](http://opencv.org/about.html). It includes the native OpenCV module, a sample face detection function and some other dependencies, so you can just write your awesome functions without going through the steps to install the native OpenCV.


> OpenCV (Open Source Computer Vision Library) is an open source computer vision and machine learning software library. OpenCV was built to provide a common infrastructure for computer vision applications and to accelerate the use of machine perception in the commercial products. Being a BSD-licensed product, OpenCV makes it easy for businesses to utilize and modify the code.


![](https://fc-album-public.oss-cn-shanghai.aliyuncs.com/tmp/20170628214419-868faa85-baa1-41c4-98b2-2034236ed4d8.jpg)

## Usage
* Setup functions: https://help.aliyun.com/document_detail/51733.html
* Setup API Gateway APIs: https://help.aliyun.com/document_detail/54788.html

```
var event = {
    queryParameters: {
        url: "http://upload.mcchina.com/2014/0721/1405918321360.jpg",
        result: "image"
    }
};
function output:
{
	"isBase64Encoded": true,
	"statusCode": 200,
	"headers": {
		"x-faces": 8
	},
	"body": base64 encoded image...skip...
}
```

```
var event = {
    queryParameters: {
        url: "http://upload.mcchina.com/2014/0721/1405918321360.jpg",
        result: "redirect"
    }
};

function output:
{
	"isBase64Encoded": false,
	"statusCode": 303,
	"headers": {
		"Location": "https://fc-album-public.oss-cn-shanghai.aliyuncs.com/tmp/20170628214419-868faa85-baa1-41c4-98b2-2034236ed4d8.jpg",
		"x-faces": 8
	},
	"body": null
}
```

```
var event = {
    queryParameters: {
        url: "http://upload.mcchina.com/2014/0721/1405918321360.jpg",
        result: "json"
    }
};

function output:
{
	"isBase64Encoded": false,
	"statusCode": 200,
	"headers": {},
	"body": {
		"faces": 8,
		"outputUrl": "https://fc-album-public.oss-cn-shanghai.aliyuncs.com/tmp/20170628214311-f438158b-7f96-45da-a249-f750f731a2f9.jpg"
	}
}
```


## TODO
* Add unit tests
* Write a detailed introduction
