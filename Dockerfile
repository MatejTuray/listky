FROM node:14

WORKDIR /src

COPY . .

RUN apt-get update && apt-get install default-jre default-jdk -y

RUN npm ci

RUN npx serverless config credentials --provider aws --key SOMEAWSACCESSKEY --secret AWSSECRETACCESSKEY --profile default

RUN npx serverless dynamodb install

EXPOSE 3000

CMD ["npx", "serverless", "offline", "start", "--host", "0.0.0.0"]