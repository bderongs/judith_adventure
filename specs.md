Contexte global : Création d'un jeu vidéo d'exploration/aventure à la première personne (FPS style) en HTML5, basé sur des dessins d'enfants. L'esthétique visuelle doit imiter une aquarelle 2D animée dans un espace 3D.

Pile Technique :

Moteur : Babylon.js (JavaScript/WebGL).

Vue : First-Person (Caméra subjective, contrôles ZQSD + Souris).

Assets : Modèles 3D (.glb) et sprites 2D (billboarding) issus de dessins manuels.

Style Visuel : Post-process shader "Watercolor/Hand-drawn" (contours noirs, textures papier).

Architecture : Modulaire, pour permettre l'ajout de niveaux et une future intégration multijoueur (Socket.io).

🛠 Étapes de développement (À donner au LLM une par une)
Étape 1 : Le "Moteur" de base (Mouvement et Physique)
Objectif : Créer la scène Babylon.js avec un sol et une caméra FPS.

Détails : Configurer l' UniversalCamera, activer la gravité (scene.enablePhysics), et gérer les collisions simples pour ne pas passer à travers le sol ou les murs.

Étape 2 : L'Identité Visuelle (Le Shader Aquarelle)
Objectif : Créer le rendu "dessin".

Détails : Implémenter un pipeline de rendu incluant un effet de contour (Edge Detection) et une superposition de texture de grain de papier pour briser le côté "trop lisse" de la 3D.

Étape 3 : Système de Niveaux et Assets (Jungle & Glace)
Objectif : Charger les environnements.

Détails : Créer une fonction de chargement de niveau qui importe des fichiers .glb. Utiliser la technique du Billboarding pour les éléments 2D (comme tes serpents ou tes totems) : ce sont des images plates qui font toujours face au joueur.

Étape 4 : IA des Ennemis et Interactions
Objectif : Rendre le monde vivant.

Détails : Créer un script d'ennemi simple qui se déplace vers le joueur ou patrouille. Ajouter un système d'interaction (Raycast) pour que le joueur puisse cliquer sur les monolithes/objets magiques.

Étape 5 : Préparation au Multijoueur
Objectif : Rendre les positions synchronisables.

Détails : Structurer les données du joueur (ID, position, rotation) pour qu'elles puissent être envoyées à un futur serveur Node.js.