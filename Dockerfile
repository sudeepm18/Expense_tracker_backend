# ---------- Base Image ----------
FROM node:18-alpine

# ---------- App Directory ----------
WORKDIR /app

# ---------- Install Dependencies First (Caching) ----------
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Copy Application Code ----------
COPY . .

# ---------- Environment Defaults ----------
ENV NODE_ENV=production
ENV PORT=3000

# ---------- Expose Port ----------
EXPOSE 3000

# ---------- Health Check ----------
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT, r => { if (r.statusCode !== 200) process.exit(1) })"

# ---------- Start Application ----------
CMD ["node", "index.js"]
