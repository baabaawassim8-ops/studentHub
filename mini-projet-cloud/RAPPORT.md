# Dossier de recommandation — Maison Zitouna

Filière : 3ème année E-business  
Matière : Cloud Computing  
Sujet : cloudifier une PME e-business avec une architecture microservices

Maison Zitouna est une PME tunisienne de vente en ligne de cosmétiques naturels, d'huiles essentielles et de savons. Le prototype joint montre la cible technique. Ce dossier justifie le choix de cloud et l'architecture.

## 1.1 Analyse de l'existant

L'infrastructure actuelle est un seul serveur physique, une base MySQL locale et des sauvegardes manuelles.

Limites :

- Une panne du serveur coupe le site, la base et les sauvegardes en même temps.
- Les pics de trafic saturent la machine, car rien ne se duplique.
- Ajouter un service impose d'intervenir sur le même système : l'évolution est lente.
- Aucune supervision : la panne est découverte par les clients.
- Les données clients restent dans MySQL sans outil d'analyse.
- Une sauvegarde oubliée ou un disque défaillant peut effacer l'historique des commandes.

Besoins fonctionnels :

- Consulter le catalogue des produits et leur stock.
- Passer une commande et recevoir une confirmation.
- Conserver l'historique des commandes et des notifications.
- Préparer l'analyse des achats clients (données séparées, exportables).

Besoins non fonctionnels :

- Disponibilité : un service en panne ne doit pas arrêter les autres.
- Élasticité : absorber un pic sans changer de machine physique.
- Persistance : données sur volume, sauvegardes automatiques.
- Maintenabilité : chaque service a son code, son conteneur et sa base.
- Observabilité : au minimum un contrôle de santé par service (`/health`).

## 1.2 Modèle de déploiement

| Critère | Cloud public | Cloud privé | Cloud hybride |
| --- | --- | --- | --- |
| Coût de départ | Faible, paiement à l'usage | Élevé (matériel, salle, équipe) | Moyen |
| Élasticité | Forte | Limitée par le matériel acheté | Forte sur la partie publique |
| Exploitation | Déléguée au fournisseur | À la charge de la PME | Partagée, plus complexe |
| Données sensibles | Chez le fournisseur | Sur site | Données sensibles sur site, le reste chez le fournisseur |
| Adapté à une PME sans équipe infra | Oui | Non | Seulement si une contrainte l'impose |

Recommandation : **cloud public**.

La PME n'a pas d'équipe d'exploitation capable de tenir un cloud privé. Son problème principal est le pic de trafic et la perte de données, pas une exigence d'hébergement sur site. Un cloud public fournit la montée en charge, les sauvegardes managées et un coût lié à l'activité. Un modèle hybride deviendrait utile plus tard si une contrainte réglementaire imposait de garder une copie des données clients en Tunisie.

Le prototype Docker Compose est l'image portable de cette cible : les mêmes conteneurs se déploient ensuite sur un service managé (Azure Container Apps, Google Cloud Run, Amazon ECS, ou un Kubernetes managé).

## 1.3 Modèles de services

| Besoin | Modèle | Justification |
| --- | --- | --- |
| Boutique et API métier | PaaS / conteneurs managés | L'équipe livre des conteneurs. Le fournisseur gère les machines, le réseau et le redémarrage. |
| Machines virtuelles de secours | IaaS | Utile seulement si un composant ne peut pas être conteneurisé. Ce n'est pas le cas ici. |
| PostgreSQL | DBaaS | Sauvegardes, restauration et haute disponibilité sans administrer un serveur MySQL physique. |
| E-mail transactionnel réel | SaaS | Un fournisseur d'e-mail (envoi, délivrabilité) remplace l'enregistrement local du prototype. |
| Envoi unitaire et redimensionnement d'images | FaaS | Petites fonctions déclenchées par une commande, sans serveur allumé en permanence. |
| Serveur physique dédié | BMaaS | Inadapté : coût fixe, retour au problème de départ, pas de gain d'élasticité. |
| Tableaux de bord clients | SaaS | Un outil d'analyse managé exploite les données que le monolithe n'exploitait pas. |

Le prototype retient PaaS (quatre conteneurs) et DBaaS (PostgreSQL). Les notifications sont une API interne qui tient le rôle du futur SaaS d'e-mail.

## 2. Architecture cible

Trois microservices, plus une vitrine :

1. **Catalogue** — produits et stock. `GET /products`. La réservation `POST /products/{id}/reserve` décrémente le stock seulement s'il est suffisant.
2. **Commandes** — `POST /orders` et `GET /orders`. Ce service appelle le catalogue, puis les notifications.
3. **Notifications** — `POST /notify` et `GET /notifications`. Chaque envoi est conservé dans sa propre base.
4. **Web** — pages sur le port 8000. Le navigateur ne parle qu'à cette vitrine. Les appels entre API restent dans le réseau Docker `artisan-net`.

Chaque service a son Dockerfile. Les bases `catalogue`, `commandes` et `notifications` sont créées au premier démarrage de PostgreSQL et conservées dans le volume `pgdata`. Les mots de passe et les URL passent par les variables d'environnement de Compose.

## 3. Justification des choix techniques

- **Docker et Docker Compose** : imposés par le cahier des charges, suffisants pour un prototype de trois services, et identiques en local et en CI.
- **Flask** : une API REST courte par service, facile à expliquer à l'oral.
- **PostgreSQL plutôt que SQLite** : une base serveur partagée par le réseau Docker, avec un vrai volume. SQLite dans trois fichiers aurait moins bien illustré un DBaaS.
- **Une instance PostgreSQL, trois bases** : chaque service possède son schéma et ses données, sans le coût de trois moteurs pour une PME.
- **Pas de code partagé entre services** : un changement du catalogue n'oblige pas à reconstruire les notifications.
- **GitHub Actions** : à chaque push, les images sont reconstruites et un scénario réel crée une commande. Le test échoue si un service ne répond pas.

## 4. Ce que le prototype ne fait pas encore

Le conteneur notifications enregistre le message. Il n'envoie pas encore d'e-mail : ce serait un SaaS branché sur la même API. Il n'y a pas de répartition de charge ni de supervision (Prometheus, journaux centralisés). Ces éléments appartiennent au déploiement cloud public, après le prototype.
