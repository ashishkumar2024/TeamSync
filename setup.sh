#!/bin/bash
set -e

echo "🚀 TeamSync Setup Script"
echo ""

# Check if dev mode
if [ "$1" = "dev" ]; then
  echo "📦 Starting in DEV mode..."
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
  
  echo "⏳ Waiting for services to be ready..."
  sleep 10
  
  echo "🔄 Running migrations..."
  docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma migrate deploy
  
  echo "🌱 Seeding database..."
  docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts
  
  echo ""
  echo "✅ Dev setup complete!"
  echo "Frontend: http://localhost:5173"
  echo "Backend:  http://localhost:4000"
  echo "Swagger:  http://localhost:4000/api/docs"
else
  echo "📦 Starting in PRODUCTION mode..."
  docker-compose up -d
  
  echo "⏳ Waiting for services to be ready..."
  sleep 10
  
  echo "🔄 Running migrations..."
  docker-compose exec backend npx prisma migrate deploy
  
  echo "🌱 Seeding database..."
  docker-compose exec backend npx ts-node prisma/seed.ts
  
  echo ""
  echo "✅ Production setup complete!"
  echo "Frontend: http://localhost:5173"
  echo "Backend:  http://localhost:4000"
  echo "Swagger:  http://localhost:4000/api/docs"
fi

echo ""
echo "📊 Check status: docker-compose ps"
echo "📝 View logs:    docker-compose logs -f"
