#!/bin/bash

if [ -z $1 ]; then
    echo provide a pid as first argument
    exit 1
fi

kill -s SIGUSR1 $1
