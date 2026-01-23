// Test simple pour vérifier que Vercel fonctionne
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'FinSmart API Test',
    timestamp: new Date().toISOString()
  });
}
