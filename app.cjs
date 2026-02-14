// Wrapper CommonJS pour LiteSpeed/cPanel
// Ce fichier charge le module ES de manière dynamique

async function startApp() {
  try {
    await import('./server.js');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApp();
