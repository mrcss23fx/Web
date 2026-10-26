# Bitácora de Trading · versión web

## Qué hay en esta carpeta

- `index.html`: la web completa.
- `config.js`: aquí van los datos de tu proyecto de Supabase.
- `supabase.sql`: crea la base de datos, las reglas de privacidad y el espacio para las fotos.

## Puesta en marcha (unos 15 minutos)

### 1. Crear la base de datos en Supabase
1. Entra en supabase.com, crea una cuenta y pulsa **New project**. Ponle un nombre, una contraseña y la región **Europe**.
2. Cuando esté listo, ve a **SQL Editor** → **New query**, pega todo el contenido de `supabase.sql` y pulsa **Run**. Debe salir «Success».
3. Ve a **Project Settings** → **API** y copia la **Project URL** y la clave **anon public**.
4. Ábrelas en `config.js` y sustituye `TU_PROYECTO` y `TU_CLAVE_ANON_PUBLIC` por las tuyas.

### 2. Ajustes de acceso
- **Authentication** → **URL Configuration** → **Site URL**: pon la dirección de tu web cuando la tengas (por ejemplo `https://tunombre.github.io/bitacora/`).
- Para probar rápido con tu amigo, puedes desactivar la confirmación por correo en **Authentication** → **Providers** → **Email** → **Confirm email**. Así se entra nada más crear la cuenta.

### 3. Publicar la web
- **GitHub Pages (gratis):** sube estos archivos a un repositorio y actívalo en **Settings** → **Pages**.
- **Hostinger:** en hPanel, **Avanzado** → **Git**, conecta el repositorio de GitHub y despliega en `public_html`. Se actualiza solo cada vez que se sube un cambio.
- **Netlify:** arrastra esta carpeta a app.netlify.com/drop.

### 4. Traer tus datos de la bitácora de Claude
1. En la bitácora de Claude, entra en **Mi plan** → **Mi sistema** y pulsa **Descargar mis datos**. Incluye tus fotos.
2. En la web, crea tu cuenta y entra en **Mi plan** → **Cuenta** → **Importar archivo de datos**.

## Grupos con amigos
- **Grupo** → crea un grupo y pasa el código de invitación a tu amigo.
- Cada uno elige en **Qué comparto** lo que ve el grupo: resultados, rachas, disciplina, operaciones, notas, capturas, dinero, lecciones, metas y tablero de sueños.
- Tu diario completo nunca sale de tu cuenta: al grupo solo le llega lo que actives.

## Privacidad
- Cada usuario solo puede leer y escribir sus propios datos (reglas de la base de datos).
- Las fotos se guardan con nombres aleatorios imposibles de adivinar. El grupo solo recibe el enlace de las fotos que tú decidas compartir.
