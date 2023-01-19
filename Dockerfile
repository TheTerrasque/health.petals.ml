FROM node:16 as builder

WORKDIR /app
COPY health-frontend/package.json /app/
RUN npm install
COPY health-frontend/ /app/
RUN npm run build

FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1 
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app
COPY requirements.txt /app/
RUN apt update && apt install -y git && apt clean
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py p2p_utils.py /app/
COPY --from=builder /app/build /app/health-frontend/build

ENV RUN_ENV=prod

EXPOSE 5990

CMD gunicorn -w 2 -b 0.0.0.0:5990 app:app