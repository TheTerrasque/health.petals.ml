FROM node:16 as builder

WORKDIR /app
COPY health-frontend/package.json /app/
RUN npm install
COPY health-frontend/ /app/
RUN npm run build

FROM python:3.9-slim-buster

WORKDIR /app
COPY requirements.txt /app/
RUN apt update && apt install -y git && apt clean
RUN pip install -r requirements.txt

COPY app.py p2p_utils.py /app/
COPY --from=builder /app/build /app/health-frontend/build

EXPOSE 5990

CMD gunicorn -w 2 -b 0.0.0.0:5990 app:app