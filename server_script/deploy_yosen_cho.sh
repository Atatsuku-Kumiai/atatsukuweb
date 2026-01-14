#!/usr/local/bin/bash
###!/bin/bash
#
#  Seploy Script for Sakura Rental Server using FreeBSD
#
echo "Start Deploy for Yusen-Chotatsu"
date
#
self_dir=$(cd $(dirname $0); pwd)
#
#cd ${self_dir}/../
cd ~/www/hp/atatsukuweb/server_script
#
exec_dir=$(pwd)
#
echo "git pull main branch on ${exec_dir}"
git pull
#
echo "  Deploy finished"
