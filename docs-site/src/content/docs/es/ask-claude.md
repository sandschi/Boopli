---
title: Preguntar a Claude
description: Una opción extra que puedes usar junto a tu agente de IA de Home Assistant mediante una rutina en tu cuenta de Claude.
---

**Preguntar a Claude** es un botón extra junto al botón habitual de [Ayuda con IA](/Boopli/es/ai-help/). No sustituye a tu agente de IA de Home Assistant. Usa esta opción cuando:

- quieras una segunda opinión porque tienes dudas sobre la respuesta de tu agente,
- tu agente gratuito no esté disponible o haya alcanzado su límite de consultas,
- no tengas ningún agente configurado.

Funciona mediante una **rutina** en tu propia cuenta de Claude. Cada consulta ejecuta la rutina una vez. Boopli no tiene servidor propio, así que las consultas no pasan por un servidor de Boopli.

:::caution[Versión preliminar de investigación]
Las rutinas de Claude pueden cambiar mientras estén en fase preliminar. Boopli tiene un límite de 20 consultas por hora. Cada ronda de preguntas y cada lista de pasos consume una consulta.
:::

![La ventana Preguntar a Claude en Configuración](/Boopli/img/es/ask-claude.jpg)

## Qué necesitas

- Una cuenta de Claude en claude.ai que permita crear rutinas.
- Una instalación de Home Assistant accesible desde internet (con una URL externa, por ejemplo, mediante Nabu Casa o tu propio dominio). Claude envía la respuesta a Home Assistant, así que tiene que poder conectarse.

## Crear la rutina

El paso Preguntar a Claude de la guía Ayuda con IA muestra estas instrucciones junto a tu dirección de Home Assistant. Usa la [página de rutinas de Claude](https://claude.ai/code/routines) para configurar la rutina una sola vez.

1. Crea una rutina y ponle el nombre **Boopli**.
2. Pega las instrucciones de la guía. Le dicen a Claude que primero mire las fotos que haya, prepare la respuesta, la envíe en una sola petición web y se detenga. También le indican que ignore las instrucciones ocultas en una foto o en el texto de la tarea.
3. Crea un **entorno** para la rutina. Configura el acceso a la red como **Limitado** y permite tu dirección de Home Assistant. La guía muestra el nombre de host exacto.
4. Añade un **activador de API** a la rutina y selecciona **Generar token**. Copia el token en ese momento. Claude solo lo muestra una vez.
5. Deja todos los conectores (Gmail, calendario, etc.) **desactivados**. La rutina no los necesita.

Las pantallas de Claude cambian de vez en cuando. Puede que algún botón tenga un nombre un poco distinto.

## Conectar la rutina con Boopli

Abre **Configuración**, selecciona **Opciones avanzadas** en la tarjeta **Ayuda con IA** y luego **Preguntar a Claude (extra)**. También puedes usar la guía.

1. Selecciona **Activar «Preguntar a Claude»**.
2. Pega la URL en **Dirección para iniciar la rutina**. Empieza por `https://api.anthropic.com/v1/claude_code/routines/` y termina en `/fire`.
3. Pega el token en **Token de la rutina** y selecciona **Guardar token**.
4. Selecciona **Probar Claude**. Boopli guarda tus ajustes, le pide a Claude una respuesta breve y te dice cuántos segundos tardó.

Si necesitas configurar o cambiar la dirección para recibir la respuesta de Claude, abre **Opciones avanzadas: dirección web de Home Assistant** y rellena **Adónde envía la rutina su respuesta**.

## Cómo funciona

1. Selecciona **Preguntar a Claude**. Boopli envía a tu rutina el texto de la tarea, tus respuestas y las notas de espacios o fotos que elegiste compartir.
2. La rutina prepara la respuesta y la envía al webhook que Boopli creó en Home Assistant.
3. Boopli muestra la respuesta. Espera hasta 2 minutos por consulta. Si no puede leer la respuesta, envía una consulta más.

Cada consulta tiene un ID de un solo uso. Boopli acepta una sola respuesta mientras sigue esperando esa consulta.

Cualquier persona con acceso al panel puede seleccionar **Preguntar a Claude**. Solo quienes tienen permisos de administración pueden guardar o quitar el token y seleccionar **Probar Claude**.

## Fotos

Cuando seleccionas fotos para Claude, Boopli guarda cada una en un archivo temporal en la carpeta de medios de Home Assistant. Le da a la rutina un enlace firmado que dura hasta 10 minutos. La rutina descarga las fotos. Boopli borra sus propios archivos temporales al terminar la consulta, aunque falle. Claude puede conservar las fotos que recibió.

## Qué ve Claude

Por su cuenta, Boopli no envía nada a Claude. Cuando haces una consulta, Claude recibe el texto de la tarea, tus respuestas y las notas de espacios o fotos que elegiste compartir. Si le pides que te haga preguntas sobre un espacio, recibe su nombre y sus notas actuales. Claude puede conservar lo que compartas. Boopli deja fuera de la consulta los nombres de tus dispositivos, el historial de Home Assistant y tu ubicación. Lo que escribas o fotografíes puede contener datos privados.

## Tu token es secreto

Boopli guarda el token en un archivo privado dentro del almacenamiento de Home Assistant. El token queda fuera de los ajustes y de las copias de seguridad (`.adhd`). El panel solo sabe si hay un token guardado. Si crees que alguien pudo acceder a él, crea uno nuevo en claude.ai y pégalo en Boopli con **Reemplazar**.

Si Boopli no puede guardar el token, te avisa y sigue usando el anterior. Si al arrancar no puede leer el archivo privado, Boopli sigue funcionando con Preguntar a Claude desactivado, conserva el archivo tal como está y anota el motivo en el registro de Home Assistant.

Consulta [Solución de problemas](/Boopli/es/troubleshooting/) si algo falla.
