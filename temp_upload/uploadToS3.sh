#!/bin/bash

aws s3api put-object --bucket img-rekog --key ${1} --body ${1};
