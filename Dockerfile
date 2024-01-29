# Verwenden Sie die neueste stabile Node-Version
FROM node:20-alpine as build

# Arbeitsverzeichnis festlegen
WORKDIR /app

# Installieren Sie die neueste stabile Angular CLI-Version
# Verwenden Sie 'npm install' ohne '-g', um die CLI im Projekt zu halten
RUN npm install -g @angular/cli@latest

# Kopieren Sie package.json und package-lock.json zuerst für besseres Caching
COPY package.json package-lock.json ./

# Installieren Sie Node-Module (abhängig von package-lock.json, also gutes Caching)
RUN npm ci

# Kopieren Sie den restlichen Projektcode
COPY . .

# Builden Sie die Anwendung für die Produktion
RUN ng build

# Produktions-Stage, verwenden Sie einen Nginx-Webserver um die gebaute App auszuliefern
FROM nginx:alpine

# Kopieren Sie die gebaute App aus dem Build-Stage

COPY --from=build /app/dist/map-for-andre/browser /usr/share/nginx/html

# Der Nginx-Server startet automatisch, daher ist kein CMD erforderlich
