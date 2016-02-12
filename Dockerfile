FROM mhart/alpine-node:5.6

MAINTAINER Caleb Thorsteinson <caleb@thorsteinson.io>
LABEL description="Use AWS SNS for service notifications" version="0.1"

# Set node to production mode so dev dependencies aren't added
ENV NODE_ENV production

# Allow setting of the AWS credentials
#ENV AWS_ACCESS_KEY_ID
#ENV AWS_SECRET_ACCESS_KEY

EXPOSE 80

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

# Copy over all source files
# Dockerignore should prevent adding npm modules
COPY . /usr/src/app

CMD ["npm", "start"]
