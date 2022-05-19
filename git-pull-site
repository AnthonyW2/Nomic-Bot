#!/bin/bash

#Update the local copy of the Nomic website repo to match the remote repo



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

#Pull any changes to the remote repo to the local repo
git pull

exit 0
