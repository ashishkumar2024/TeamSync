import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Express } from 'express';
import fs from 'node:fs';

export function setupSwagger(app: Express) {
  const candidates = [
    path.join(process.cwd(), 'dist', 'docs', 'openapi.yaml'),
    path.join(process.cwd(), 'src', 'docs', 'openapi.yaml'),
    path.join(__dirname, '..', 'docs', 'openapi.yaml'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) return;
  const swaggerDocument = YAML.load(filePath);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

