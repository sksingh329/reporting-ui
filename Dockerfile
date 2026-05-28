# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy as template — envsubst renders it at container start
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
# Substitute only our ${VAR} placeholders; nginx's own $var (no braces) are left untouched
CMD ["/bin/sh", "-c", \
  "envsubst '${NGINX_DNS_RESOLVER} ${NGINX_BACKEND_URL} ${NGINX_BACKEND_HOST}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf \
  && nginx -g 'daemon off;'"]
