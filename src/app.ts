import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import { env, validateEnv } from './config/env';
import { getPool } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { startBot, stopBot } from './bot';
import { ensureAdminExists } from './models/User';

async function main(): Promise<void> {
  console.log('\n🚀 Iniciando FinBot...\n');

  // Valida variaveis de ambiente
  validateEnv();

  // Inicializa conexao com banco de dados
  try {
    await getPool();
    // Garante que existe um usuario admin
    await ensureAdminExists();
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados. Verifique as configuracoes.');
    process.exit(1);
  }

  // Cria app Express
  const app = express();

  // Middlewares
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas da API
  app.use('/api', routes);

  // Servir arquivos estaticos do frontend (quando disponivel)
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  // Fallback para SPA
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).json({
          message: 'FinBot API esta rodando!',
          docs: '/api/health',
        });
      }
    });
  });

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Inicia servidor HTTP
  const server = app.listen(env.port, () => {
    console.log(`\n🌐 Servidor rodando em http://localhost:${env.port}`);
    console.log(`📡 API disponivel em http://localhost:${env.port}/api`);
  });

  // Inicia bot do Telegram
  const bot = startBot();
  if (bot) {
    console.log('💬 Bot do Telegram ativo e aguardando mensagens\n');
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n⏹️  Encerrando...');
    stopBot();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
