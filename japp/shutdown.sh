#!/bin/sh
kill -9 `ps -ef|grep Client | grep -v grep | awk '{print $2}'`