#!/bin/bash

##
## This must be run with sudo
##

##
## First, nginx
##
apt-get update
apt-get -assume-yes install nginx
systemctl enable nginx

apt-get --assume-yes install \
    python3 \
    python3-flask \
    python3-flask-restful \
    python3-flask-sqlalchemy \
    python3-mysqldb \
    python3-requests \
    uwsgi \ 
    uwsgi-plugin-python3

