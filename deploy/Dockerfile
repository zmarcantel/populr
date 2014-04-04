##
##    Populr
##
##

FROM monokrome/node
MAINTAINER Zachary Marcantel, zach@zed.io, zmarcantel@utexas.edu

RUN apt-get install -y git nginx

## copy the source
RUN cd /srv && git clone https://github.com/zmarcantel/populr
RUN cd populr

## install deps
RUN npm install && bower install

## setup nginx conf
ADD populr.nginx /etc/nginx/sites-available/populr
RUN sed -e -i "s/exampledomain.com/*/g" /etc/nginx/sites-available/populr
RUN sed -e -i "s/listen 80/listen 1492/g" /etc/nginx/sites-available/populr
RUN ln -s /etc/nginx/sites-available/populr /etc/nginx/sites-enabled/populr

## setup upstart conf
ADD populr.upstart /etc/init/populr.conf

EXPOSE 1492
USER root
CMD service populr start && service nginx reload
