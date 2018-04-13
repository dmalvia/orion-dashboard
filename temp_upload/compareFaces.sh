#!/bin/bash

var=$(echo "aws rekognition compare-faces --source-image '{\"S3Object\":{\"Bucket\":\"img-rekog\",\"Name\":\"REF_IMAGEXX\"}}' --target-image '{\"S3Object\":{\"Bucket\":\"img-rekog\",\"Name\":\"TO_COMPARE_IMGXX\"}}' --region us-west-2" | sed -e "s|REF_IMAGEXX|${1}|" | sed -e "s|TO_COMPARE_IMGXX|${2}|g")

response=`eval $var`

sim=`echo $response | jq '.FaceMatches[].Similarity'`;

if [[ -z $sim ]];
then
	echo "0";
else
	echo $sim;
fi
