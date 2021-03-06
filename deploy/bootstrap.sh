#!/bin/bash

set -ev

##
## This must be run with sudo
##

##
## First, nginx
##
apt-get update
apt-get --assume-yes install nginx
systemctl enable nginx

##
## Next, node & the app
##
apt-get --assume-yes install npm
cd /home/admin/covidapp/app && npm install && npm run build
mkdir -p /var/www/covidstoplight.org/html
cp -r /home/admin/covidapp/app/dist/* /var/www/covidstoplight.org/html
chown -R admin:www-data /var/www/covidstoplight.org/html
cp /home/admin/covidapp/deploy/nginx.conf /etc/nginx/sites-available/covidstoplight.org
ln -s /etc/nginx/sites-available/covidstoplight.org /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx

##
## API
##
apt-get --assume-yes install \
    python3 \
    python3-flask \
    python3-flask-restful \
    python3-flask-sqlalchemy \
    python3-mysqldb \
    python3-requests \
    uwsgi \
    uwsgi-plugin-python3

mkdir -p /run/uwsgi
chown admin:www-data /run/uwsgi
STOPLIGHT_DATABASE_URI=$STOPLIGHT_DATABASE_URI nohup uwsgi --ini /home/admin/covidapp/api/covidapp.ini &
