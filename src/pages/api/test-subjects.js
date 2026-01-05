export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API route fonctionne',
    method: req.method,
    url: req.url 
  });
} 