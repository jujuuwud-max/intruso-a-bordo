INTRUSO A BORDO — SERVIDOR DE AMIGOS (PROTOTIPO)

QUÉ HACE
- Registra el tag y el nombre visible de cada jugador cuando abre su perfil.
- Envía solicitudes de amistad entre cuentas registradas en el mismo servidor.
- Permite consultar, aceptar y rechazar solicitudes y eliminar amigos.
- Guarda los datos en data/social.json para que sobrevivan a reinicios.
- Incluye el juego en index.html.

REQUISITOS
- Node.js 18 o posterior (no necesita instalar dependencias).

INICIAR EN TU ORDENADOR
1. Descomprime esta carpeta.
2. Abre una terminal dentro de la carpeta intruso-a-bordo-servidor.
3. Ejecuta: node server.js
4. Abre http://localhost:3000 en el navegador.
5. Cada jugador debe abrir esa misma web y entrar una vez en Perfil y amigos para registrar su tag.
6. Después, comparte los tags y envía solicitudes desde la pestaña Amigos.

PARA QUE FUNCIONE ENTRE ORDENADORES
El servidor debe estar publicado en un hosting accesible por internet, y todos deben entrar en la misma dirección pública. No basta con enviar el archivo HTML. Este paquete no está publicado automáticamente en internet.

IMPORTANTE / SEGURIDAD
Este es un prototipo para pruebas: los tags no están protegidos con contraseña ni verificación de identidad. No lo uses para datos personales ni lo expongas públicamente sin añadir autenticación, límites de solicitudes y almacenamiento persistente apropiado. El servidor de este paquete gestiona amistades; las partidas en línea en tiempo real siguen siendo una función separada y no quedan convertidas en multijugador por este cambio.
