# Angular v21 frontend — multi-stage build, nginx ile servis
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/dijitalatolye-web-ng/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
