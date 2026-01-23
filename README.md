# FinSmart Backend API

API REST pour l'application de gestion d'objectifs financiers FinSmart.

## Technologies

- **Node.js** avec **Express.js**
- **MongoDB** avec **Mongoose ODM**
- **JWT** pour l'authentification
- **Joi** pour la validation
- **Winston** pour les logs

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier les variables d'environnement selon votre configuration
```

## Configuration

Configurez les variables d'environnement dans le fichier `.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finsmart
JWT_SECRET=votre-secret-jwt-tres-long-et-securise
JWT_REFRESH_SECRET=votre-secret-refresh-tres-long-et-securise
```

## Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

## Structure du projet

```
src/
├── config/          # Configuration (DB, logger, env)
├── controllers/     # Controllers (logique des routes)
├── middleware/      # Middleware (auth, validation, errors)
├── models/          # Modèles Mongoose
├── routes/          # Définition des routes
├── services/        # Logique métier
├── utils/           # Utilitaires
└── validators/      # Schémas de validation Joi
```

## Endpoints API

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Déconnexion

### Utilisateurs
- `GET /api/v1/users/me` - Profil utilisateur
- `PUT /api/v1/users/me` - Modifier le profil
- `PUT /api/v1/users/me/password` - Changer le mot de passe

### Objectifs
- `GET /api/v1/goals` - Liste des objectifs
- `POST /api/v1/goals` - Créer un objectif
- `GET /api/v1/goals/:id` - Détail d'un objectif
- `PUT /api/v1/goals/:id` - Modifier un objectif
- `DELETE /api/v1/goals/:id` - Supprimer un objectif
- `POST /api/v1/goals/:id/contribute` - Ajouter une contribution
- `GET /api/v1/goals/dashboard` - Dashboard statistiques

### Catégories
- `GET /api/v1/categories` - Liste des catégories

## Sécurité

- ✅ Mots de passe hashés avec bcrypt (12 rounds)
- ✅ JWT avec expiration courte (1h access, 7j refresh)
- ✅ Rate limiting (100 req/15min général, 5 req/15min auth)
- ✅ Validation stricte des inputs avec Joi
- ✅ Headers sécurisés avec Helmet
- ✅ CORS configuré
- ✅ Sanitization des erreurs en production

## Tests

Pour tester l'API, vous pouvez utiliser:
- **Postman** ou **Insomnia**
- **curl**
- Le frontend React Native

### Exemple avec curl

```bash
# Inscription
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!",
    "language": "fr"
  }'

# Connexion
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

## Licence

ISC
