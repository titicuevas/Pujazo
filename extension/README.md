# Extensión Chrome · Pujazo

Copia el texto visible de **Biwenger web** (plantilla o mercado) y abre Pujazo para importarlo. **No sube datos**: todo ocurre en tu navegador.

## Instalar (modo desarrollador)

1. Abre Chrome → `chrome://extensions`
2. Activa **Modo de desarrollador**
3. **Cargar descomprimida** → elige esta carpeta `extension/`
4. Abre [biwenger.as.com](https://biwenger.as.com/) en Plantilla o Mercado
5. Pulsa el icono de Pujazo → **Copiar y abrir Pujazo**

Configura la URL de tu despliegue en el popup (por defecto `https://pujazo.vercel.app`). Si usas otro dominio de Vercel, cámbialo ahí (se guarda).

## Qué hace

- Lee el texto visible de la pestaña Biwenger
- Lo copia al portapapeles
- Abre `/analizar?pegar=1&clip=1` para intentar el auto-pegado

Si el auto-pegado falla (permiso del portapapeles), usa **Pegar del portapapeles** en Pujazo.

## Privacidad

- Sin analytics ni servidores de Pujazo en la extensión
- Solo permisos de pestaña activa + Biwenger + escribir portapapeles
- No inicia sesión en tu cuenta de fantasy ni automatiza fichajes
