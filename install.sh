#!/bin/bash

# Kidos - Installation Automatique sur CasaOS / Raspberry Pi

echo "🚀 Préparation de l'installation de Kidos..."

# Vérification de Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Erreur: Docker n'est pas installé. Veuillez l'installer d'abord."
  exit 1
fi

# Vérification de Docker Compose
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "❌ Erreur: Docker Compose n'est pas installé."
  exit 1
fi

# Construction et lancement du conteneur
echo "🏗️  Construction de l'image Docker (cela peut prendre quelques minutes sur Raspberry Pi)..."
docker-compose up -d --build

echo ""
echo "✅ Installation terminée !"
echo "🌐 L'application est disponible à l'adresse: http://$(hostname -I | awk '{print $1}'):3000"
echo "📱 Vous pouvez l'installer comme une application (PWA) sur votre mobile/tablette."
