#!/bin/bash

FILE_NAME=$1;
HEIGHT=`identify -verbose $1 | grep Geometry | sed -e 's|Geometry:||g' -e 's|+0+0||g' -e 's|[0-9]*x||g' -e 's/^[ \t]*//'`;

REG_EX_TO="To\.\|TO\.\|To\,|TO\,";
REG_EX_ENROLLMENT="Enrollment\|Enrollmen\|Enrollme\|Enrollm\|Enroll\|nrollment\|rollment\|ollment\|llment\|No";
REG_EX_PAN_DOB="[0-9][0-9].[0-9][0-9].[0-9][0-9][0-9][0-9]";
REG_EX_PAN="[A-Z]\{5,5\}[0-9]\{4,4\}[A-Z]";
REG_EX_NAME="[A-Za-z][A-Za-z ]*";
REG_EX_PHONE="[0-9]\{10,10\}"
REG_EX_AADHAAR="[0-9]\{4,4\} [0-9]\{4,4\} [0-9]\{4,4\}";

INITIAL_FUZZ=30;
FUZZ_VALUE=$INITIAL_FUZZ;
MAXIMUM_FUZZ=80;
INCREMENT_FUZZ_BY=5;
PAN="";
DOB="";
NAME="";
GUARDIAN="";
PHONE_NUMBER="";
TEXT="";
AADHAAR="";

HEIGHT_1=`expr $HEIGHT \* 60`;
HEIGHT_1=`expr $HEIGHT_1 / 100`;
HEIGHT_2=`expr $HEIGHT - $HEIGHT_1`;
HEIGHT_2=`expr $HEIGHT_2 \* 50`;
HEIGHT_2=`expr $HEIGHT_2 / 100`;
HEIGHT_3=`expr $HEIGHT \* 90`;
HEIGHT_3=`expr $HEIGHT_3 / 100`;

information_captured()
{
	if [[ -z $PAN || -z $DOB ]];
	then
		echo "In";
		printValues;
		return 0;	
	fi
	
	return 1;
}

printValues()
{
	echo "PAN: $PAN";
	echo "DOB: $DOB";
	echo "NAME: $NAME";
	echo "GUARDIAN: $GUARDIAN";
}

convert $FILE_NAME -crop +0-$HEIGHT_1 -crop +0+$HEIGHT_2 ADDRESS_$FILE_NAME;
convert $FILE_NAME -crop +0+$HEIGHT_3 AADHAAR_$FILE_NAME;

convert ADDRESS_$FILE_NAME -density 5000 -resize "2000x" DENSE_ADDRESS_$FILE_NAME;
convert AADHAAR_$FILE_NAME -density 5000 -resize "2000x" DENSE_AADHAAR_$FILE_NAME;

N_LINE=-1;
G_LINE=-1;
PAN_LINE=-1;
DOB_LINE=-1;

while [[ $FUZZ_VALUE -le $MAXIMUM_FUZZ ]]
do
	#echo;echo;
	#echo "For FUZZ Value: $FUZZ_VALUE";
	#convert DENSE_ADDRESS_$FILE_NAME -fill white -fuzz $FUZZ_VALUE% +opaque "#000000" READY_ADDRESS_$FILE_NAME;
	cp DENSE_ADDRESS_$FILE_NAME READY_ADDRESS_$FILE_NAME;
	cp DENSE_AADHAAR_$FILE_NAME READY_AADHAAR_$FILE_NAME;
	
	convert READY_ADDRESS_$FILE_NAME -colorspace Gray READY_ADDRESS_$FILE_NAME;
	convert READY_ADDRESS_$FILE_NAME -contrast -sharpen 0x1.5 -fill white -fuzz $FUZZ_VALUE% +opaque "#000000" READY_ADDRESS_$FILE_NAME;

	RAW_OUTPUT=`tesseract READY_ADDRESS_$FILE_NAME READY_ADDRESS_$FILE_NAME -psm 3 -l eng+hin > /dev/null`;
	RAW_OUTPUT=`tesseract READY_AADHAAR_$FILE_NAME READY_AADHAAR_$FILE_NAME -psm 3 -l eng+hin > /dev/null`;
	
	cat READY_AADHAAR_$FILE_NAME.txt >> READY_ADDRESS_$FILE_NAME.txt;
	LINE=-1;
	TEXT="";
	while read a; 
	do
		a=`echo $a | sed -e 's/^[ \t]*//'`;
		LINE=`expr $LINE + 1`;
		if [[ -z $a || $a =~ [^a-zA-Z0-9\/\ \-\,\!] ]];
		then
			continue;
		else
			
			DATE=`echo $a | grep -o $REG_EX_PAN_DOB`;
			TEXT_TEMP=`echo $a | grep -w "$REG_EX_NAME"`;
			TO_WORD=`echo $a | grep -o "$REG_EX_TO"`;
			ENROLLEMENT_WORD=`echo $a | grep -o "$REG_EX_ENROLLMENT"`;
			PHONE_NUMBER_TEMP=`echo $a | grep -o "$REG_EX_PHONE"`;
			AADHAAR_TEMP=`echo $a | grep -o "$REG_EX_AADHAAR"`;
			
			if [[ -n $DATE || -n $TO_WORD || -n $ENROLLMENT_WORD ]]
			then
				continue;	
			fi


			#echo "$TEXT_TEMP : $PHONE_NUMBER_TEMP";
			if [[ -n $TEXT_TEMP ]]
        		then
                		TEXT="$TEXT, $TEXT_TEMP";
        		fi

			if [[ -n $PHONE_NUMBER_TEMP ]]
                        then
                                PHONE_NUMBER=$PHONE_NUMBER_TEMP;
                        fi
			
			if [[ -n $AADHAAR_TEMP ]]
			then
				AADHAAR=$AADHAAR_TEMP;
			fi

			
		fi
	done < READY_ADDRESS_$FILE_NAME.txt
	
	if [[ -n $TEXT && -n $AADHAAR ]];
	then
		break;
	fi

	FUZZ_VALUE=`expr $FUZZ_VALUE + $INCREMENT_FUZZ_BY`;
done

echo "PHONE_NUMBER=$PHONE_NUMBER" > $FILE_NAME.properties;
echo "TEXT=$TEXT" >> $FILE_NAME.properties;
echo "AADHAAR=$AADHAAR" >> $FILE_NAME.properties;
