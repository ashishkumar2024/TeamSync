FROM node:20-alpine AS builder
WORKDIR /app

ENV CI=true

COPY package.json tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs index.html ./
COPY src ./src

RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["npx", "serve", "-s", "dist", "-l", "5173"]

