#!/bin/bash

FILE_NAME=$1;
#WIDTH=`identify -verbose $1 | grep Geometry | sed -e 's|Geometry:||g' -e 's|+0+0||g' -e 's|x[0-9]*||g' -e 's/^[ \t]*//'`;

REG_EX_PAN_WORD="Permanent\|Permanen\|Permane\|Account\|Accoun\|Accou\|Number\|Numbe\|Numb\|ermanent\|rmamnent";
REG_EX_INCOME_TAX_WORD="INCOME\|NCOME\|COME\|INCOM\|INCO\|TAX\|DEPARTMENT\|DEPARTMENT\|EPARTMENT\|PARTMENT\|ARTMENT\|RTMENT\|DEPARTMEN\|DEPARTME\|DEPARTM\|DEPART";
REG_EX_PAN_DOB="[0-9][0-9].[0-9][0-9].[0-9][0-9][0-9][0-9]";
REG_EX_PAN="[A-Z]\{5,5\}[0-9]\{4,4\}[A-Z]";
REG_EX_NAME="[A-Z][A-Z ]*";

INCOME_ENCOUNTERED=false;

INITIAL_FUZZ=20;
FUZZ_VALUE=$INITIAL_FUZZ;
MAXIMUM_FUZZ=40;
INCREMENT_FUZZ_BY=5;
PAN="";
DOB="";
NAME="";
GUARDIAN="";

#echo "Image Width: $WIDTH";
#HALF_WIDTH=`expr $WIDTH / 2`;
#echo "Half Width: $HALF_WIDTH";

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

#echo "convert $FILE_NAME -crop -$HALF_WIDTH+0 HALF_$FILE_NAME";
#convert $FILE_NAME -crop -$HALF_WIDTH+0 HALF_$FILE_NAME;
convert $FILE_NAME -density 6000 -resize "2000x" DENSE_$FILE_NAME;
./uploadToS3.sh DENSE_$FILE_NAME;

N_LINE=-1;
G_LINE=-1;
PAN_LINE=-1;
DOB_LINE=-1;

NAME_ENCOUNTERED=false;
PAN_TEXT_ENCOUNTERED=false;
DOB_ENCOUNTERED=false
GUARDIAN_ENCOUNTERED=true;

var=`./detectText.sh DENSE_$FILE_NAME`;
echo $var | jq '.TextDetections[] | select(.Type=="LINE") | "\(.DetectedText)=\(.Confidence)"' | sed 's|"||g' > $FILE_NAME.txt
#echo $var | jq '.TextDetections[] | select(.Type=="LINE") | .DetectedText' > $FILE_NAME.txt
	while IFS='=' read a value; 
	do
		echo;echo;
		echo "key: $a";
		a=`echo $a | sed -e 's/^[ \t]*//' | sed -e 's|"||g'`;
		echo "value: $value";
		LINE=`expr $LINE + 1`;
		if [ ${value%.*} -lt 90 ]
		then
			echo "Confidence low, skipping";
			continue;
		fi

		if [[ -z $a || $a =~ [^a-zA-Z0-9\/\ \.] ]];
		then
			echo "Not alphanumeric so skipping";
			continue;
		else
			
			PAN_TEMP=`echo $a | grep -o $REG_EX_PAN`;
			DOB_TEMP=`echo $a | grep -o $REG_EX_PAN_DOB`;
			NAME_TEMP=`echo $a | grep -w "$REG_EX_NAME"`;
			GUARDIAN_TEMP=`echo $a | grep -w "$REG_EX_NAME"`;
			PAN_TEXT=`echo $a | grep -o "$REG_EX_PAN_WORD"`;
			INCOME_TAX_TEXT=`echo $a | grep -o "$REG_EX_INCOME_TAX_WORD"`;
			
			if [[ -n $INCOME_TAX_TEXT ]]
			then
				INCOME_ENCOUNTERED=true;
				continue;
			fi
	
			echo ">> $a NAME:$NAME_TEMP, GUARDIAN:$GUARDIAN_TEMP, LINE:$LINE, N_LINE:$N_LINE, G_LINE:$G_LINE";

			if [[ $INCOME_ENCOUNTERED == "true" && -n $NAME_TEMP ]]
			then
				echo "Setting name to $NAME_TEMP";
				NAME=${NAME_TEMP//[[:digit:]]/};
				N_LINE=$LINE;
				INCOME_ENCOUNTERED=false;
				NAME_ENCOUNTERED=true;
				continue;
			fi
					
			if [[ $NAME_ENCOUNTERED == "true" && -n $GUARDIAN_TEMP ]]
        		then
				echo "Setting guardian to $GUARDIAN_TEMP"
				GUARDIAN=${GUARDIAN_TEMP//[[:digit:]]/};
				G_LINE=$LINE;
				NAME_ENCOUNTERED=false;
				GUARDIAN_ENCOUNTERED=true;
				continue;
        		fi

			if [[ $GUARDIAN_ENCOUNTERED == "true" && -n $DOB_TEMP ]]
			then
				echo "Setting DOB to $DOB_TEMP";
				DOB=$DOB_TEMP;
				DOB_LINE=$DOB_LINE;
				GUARDIAN_ENCOUNTETED=false;
				DOB_ENCOUNTERED=true;
				continue;
			fi

			if [[ $DOB_ENCOUNTERED == "true" && -n $PAN_TEXT ]]
			then
				echo "PAN text encountered";
				PAN_TEXT_ENCOUNTERED=true;
				DOB_ENCOUNTERED=false;
				continue;
			fi


			if [[ $PAN_TEXT_ENCOUNTERED == "true" ]]
			then
				echo "Setting PAN text $PAN_TEMP";
				PAN=$PAN_TEMP;
				PAN_TEXT_ENCOUNTERED=false;
				break;
			fi	

			
		fi
	done < $FILE_NAME.txt

printValues;
echo "PAN=$PAN" > $FILE_NAME.properties;
echo "DOB=$DOB" >> $FILE_NAME.properties;
echo "NAME=$NAME" >> $FILE_NAME.properties;
echo "GUARDIAN=$GUARDIAN" >> $FILE_NAME.properties;
