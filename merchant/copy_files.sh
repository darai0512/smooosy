#!/bin/bash

set -eu

BASEDIR=$(cd $(/usr/bin/dirname $0); pwd)
if [ $BASEDIR != $PWD ]; then
  echo Please move git root directory.
  exit 1
fi

mkdir -p dist/node/src/api
mkdir -p dist/node/src/static

DISTDIR=$BASEDIR/dist/node
cp $BASEDIR/webpack.config.js $DISTDIR

rsync -av --exclude='*.js' --exclude='*.ts' --exclude='*.tsx' $BASEDIR/src/api/ $DISTDIR/src/api
rsync -av --exclude='*.js' --exclude='*.ts' --exclude='*.tsx' $BASEDIR/src/static/ $DISTDIR/src/static
