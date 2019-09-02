FROM node:12.8.0-alpine

ENV APP_ROOT=${APP_ROOT:-/var/www/smooosy}
ENV LANG ja_JP.UTF-8
ENV LANGUAGE ja_JP:ja
ENV LC_ALL ja_JP.UTF-8
ENV TZ JST-9

WORKDIR ${APP_ROOT}
COPY package.json package-lock.json ${APP_ROOT}/
RUN npm i --production
COPY . ${APP_ROOT}/

# EXPOSE 8080
CMD node server.js
