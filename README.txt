INTRUSO A BORDO — VERSION CON SALAS ONLINE

ARCHIVOS
- index.html: juego con opciones En línea, Crear sala y Unirse con código.
- server.js: servidor web y API de perfiles/amigos.
- package.json: configuración para Render.

PUBLICAR / ACTUALIZAR EN RENDER
1. Descomprime este ZIP en tu ordenador.
2. En el repositorio de GitHub intruso-a-bordo, reemplaza index.html y server.js por los de esta carpeta y sube package.json.
3. Confirma los cambios (Commit changes).
4. Render debería detectar el commit y volver a desplegar. Usa Build Command: npm install y Start Command: npm start (también sirve node server.js).
5. Espera a que el despliegue aparezca como Live.
6. Abre la URL pública de tu servicio.

JUGAR ONLINE
1. Abre el juego y pulsa Jugar > En línea.
2. El anfitrión pulsa Crear sala. El juego genera un código.
3. Los amigos abren la misma URL, pulsan Jugar > En línea, escriben el código y pulsan Unirse con código.
4. Esperad en el vestíbulo; el anfitrión inicia la partida desde la consola verde del mapa.

NOTAS IMPORTANTES
- Las salas en tiempo real usan PeerJS y su servicio público de señalización por Internet; se necesita conexión y algunas redes pueden bloquear la conexión entre jugadores.
- El servidor de Node sirve el juego y la API social. El movimiento de la partida se conecta directamente entre navegadores; no es una sala gestionada por la base de datos del servidor.
- En el plan gratuito, los servicios pueden tardar en despertar después de un periodo sin uso.
- Los perfiles de esta versión usan tags y no tienen contraseña; no los uses como sistema de seguridad para información privada.
