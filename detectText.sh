#!/bin/bash

aws rekognition detect-text --image "S3Object={Bucket=img-rekog,Name=${1}}" --region us-west-2
