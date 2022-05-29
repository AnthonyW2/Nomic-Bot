#!/bin/bash

#Update the remote Nomic website repo to match the local repo



#Set a custom script for git to use when requesting the password
export GIT_ASKPASS=$(pwd)/git-scripts/git-auth.bash

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

#Export the password given to this script in the first argument
export GIT_PASSWD=$1
#Disable terminal prompts for git commands
export GIT_TERMINAL_PROMPT=0

#Add all changes
git add -A

#Commit changes
git commit -m "$2"

#Push the changes to the remote repo
git push

exit 0
