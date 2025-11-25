Pepimóvil Backend (VENI 2)

Visión General
- Plataforma de movilidad por sectores tipo Uber/Lyft.
- Backend Node.js + Express con balanceo inteligente por distancia, carga, latencia y tipo de operación.
- Autenticación con Firebase, datos en PostgreSQL/PostGIS, tiempo real por WebSocket/MQTT y notificaciones con AWS SNS.
- Soporte para enrutar operaciones pesadas a nodos con GPU (SageMaker/EC2 GPU).

Arquitectura
- API HTTP: Express sirve endpoints REST para autenticación, viajes y conductores.
- Balanceador lógico: asigna servidor óptimo en base a distancia, carga, latencia y GPU.
- Persistencia: PostgreSQL + PostGIS para geoespacial (en esta versión: modelos en memoria para desarrollo).
- Autenticación: Firebase Auth (dev: stub que acepta idToken y devuelve usuario simulado).
- Notificaciones: integración con SNS/WebSockets (dev: stub con console.log).
- Tiempo real: Socket.IO o AWS IoT Core para posiciones en vivo y eventos de viaje.
- Observabilidad: healthcheck, métricas y logs estructurados (a completar en prod).
- Infra: AWS (EC2, RDS, Lambda, SNS, S3, SageMaker), afinidad de sesión y rate limiting externo.

Stack
- Node.js 18+, Express, CORS, morgan, uuid.
- PostgreSQL 14+ y PostGIS 3+ (plan de migración desde memoria).
- Firebase Admin SDK para validar tokens.
- AWS SDK para SNS, S3, SageMaker, etc.

Estructura
veni2proyecto/pepimovil-backend/
- src/app.js
- src/server.js
- src/routes/
- src/controllers/
- src/models/
- src/services/
- src/config/
- .env.example
- package.json

Flujo Feliz (Happy Path)
1. Inicio de sesión
- POST /api/auth/login con idToken. Devuelve usuario y sesión activa.
2. Solicitud de viaje
- POST /api/trips/request con user_id, origin [lat,lng], destination [lat,lng].
- Detecta si la ruta es pesada (>3 km) y llama al balanceador.
3. Balanceo
- Asigna servidor según distancia, carga (<80%), latencia y GPU si es pesada.
4. Asignación del conductor
- Busca chofer disponible más cercano (PostGIS: ST_Distance; dev: memoria) y actualiza estado a accepted.
5. Inicio del viaje
- PATCH /api/trips/:id/accept pasa el viaje a active.
6. Monitoreo en tiempo real
- WebSocket/MQTT publica posiciones y eventos.
7. Finalización
- PATCH /api/trips/:id/complete, calcula tarifa por distancia y registra métricas.
8. Post-viaje
- Persistencia, envío a S3/RDS, actualización de modelos de recomendación.

Endpoints
- POST /api/auth/login
- POST /api/trips/request
- PATCH /api/trips/:id/accept
- PATCH /api/trips/:id/complete
- GET  /api/health
- GET  /api/drivers/nearby?lat=..&lng=..&limit=5

Modelos y Estados
- Trip: id, user_id, driver_id, origin [lat,lng], destination [lat,lng], status, assignedServer, createdAt, updatedAt, fare.
- Estados: pending → accepted → active → completed.
- Driver: id, lat, lng, available.
- User: id, name, email.

Balanceador
- Entrada: userLocation {lat,lng}, requestType (light|heavy), priority (normal|high).
- Filtros: servidores con load < 0.8; si heavy, prioriza hasGpu.
- Score: distancia_km + (load*100) + max(0, latencyMs-10)*0.5; prioridad high aplica 0.9.
- Origen de servidores: variable BALANCER_SERVERS o conjunto por defecto.

Variables de Entorno
- PORT: puerto del servidor, por defecto 3000
- NODE_ENV: development|production
- DB_URL: cadena de conexión a PostgreSQL
- AWS_REGION: región AWS
- FIREBASE_PROJECT_ID: proyecto de Firebase
- BALANCER_SERVERS: lista separada por comas, cada servidor como name:lat:lng:load:latencyMs:hasGpu
- Ejemplo: api-a:20.6736:-103.344:0.35:30:false,api-b:20.6789:-103.355:0.55:45:true

Instalación y Uso Local
- cd veni2proyecto/pepimovil-backend
- npm install
- cp .env.example .env
- npm run dev
- curl http://localhost:3000/api/health

Ejemplos de cURL
- Login: curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"idToken":"dev"}'
- Solicitar viaje: curl -X POST http://localhost:3000/api/trips/request -H 'Content-Type: application/json' -d '{"user_id":"u123","origin":[20.6736,-103.344],"destination":[20.6789,-103.355]}'
- Aceptar: curl -X PATCH http://localhost:3000/api/trips/TRIP_ID/accept -H 'Content-Type: application/json' -d '{"driver_id":"d1"}'
- Completar: curl -X PATCH http://localhost:3000/api/trips/TRIP_ID/complete

Migración a Postgres/PostGIS
- Conexión: src/config/db.js → cliente pg o pool.
- Geoespacial: columnas geography(Point,4326), índices GiST.
- Cercanía: SELECT ... ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(lng,lat),4326)) LIMIT 1;
- Transacciones para cambios de estado de los viajes y disponibilidad de chofer.

Integraciones
- Firebase Auth: validar idToken en authController con Firebase Admin.
- SNS/WebSockets: notificaciones push a choferes y usuarios; canales por sesión.
- SageMaker/EC2 GPU: enrutar cómputo pesado (rutas optimizadas, predicciones) a nodos GPU.
- S3/RDS: almacenamiento de logs, métricas y datasets de entrenamiento.

Observabilidad y Seguridad
- Healthcheck: GET /api/health
- Logs: morgan + logs estructurados (JSON) en producción
- Métricas: tiempos, latencias, errores, CPU/mem del pool del balanceador
- Seguridad: validación de entrada, rate limiting, CORS configurado, verificación de tokens

Despliegue
- Entorno: AWS (EC2/ALB para API, RDS para Postgres, ElastiCache/Redis opcional, SNS para notificaciones)
- Afinidad de sesión: sticky sessions a nivel ALB/NLB o por token de sesión
- CI/CD: build y deploy por rama; variables de entorno por stage

Roadmap
- Reemplazar modelos en memoria por Postgres/PostGIS
- Integrar Firebase Admin en login
- Añadir WebSocket para posiciones en vivo y eventos
- Persistir métricas y habilitar rate limiting externo
- Tests de integración y contract tests de API
