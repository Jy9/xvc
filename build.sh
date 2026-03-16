#!/bin/bash

# 构建脚本
echo "开始构建..."

# 安装依赖
bun i

# 构建项目
npm run build

echo "构建完成！"
