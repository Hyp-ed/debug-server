# Root directory of repo
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

git submodule init
git submodule update
(cd $DIR/server && npm install)