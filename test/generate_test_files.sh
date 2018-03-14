#!/bin/sh
rm -rf files
mkdir files
cd files
echo "This is file 1" > file1.js
echo "This is file 2" > file2.txt
mkdir dir1
mkdir dir2
mkdir dir3
cd dir1
mkdir dir4
echo "This is file 3" > dir4/file3.txt
cd ../dir2
echo "This is file 4" > file4.txt
echo "This is file 5" > file5.txt
cd ../dir3
echo "This is file 6" > file6.txt
