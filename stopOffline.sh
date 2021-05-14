#! /bin/bash
ps ax | grep node | cut -f2 -d "" - | xargs kill -15
rm .offline.pid
rm 1