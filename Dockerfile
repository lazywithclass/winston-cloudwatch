FROM node

WORKDIR /workspace

RUN apt-get update
RUN apt-get install -y vim
