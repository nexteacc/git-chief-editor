# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm install
RUN cd server && npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 构建后端
RUN cd server && npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 只复制生产需要的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/

# 安装生产依赖
RUN cd server && npm install --omit=dev

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 启动服务
CMD ["node", "server/dist/index.js"]
