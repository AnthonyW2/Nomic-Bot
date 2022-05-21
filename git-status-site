#!/bin/bash

#Get the status of the local git repo



#Change the working directory of this script to the Nomic Site local git repo
cd ../Site/Nomic

#Ensure the current working directory is what is expected
if [[ ! $(pwd) == *"Nomic/Site/Nomic"* ]]; then
  echo "Path does not match"
  exit 1
fi
if [[ ! $(ls -l | grep "index.html") == *"index.html"* ]]; then
  echo "index.html is not present"
  exit 1
fi

#Get the status
git status

exit 0
