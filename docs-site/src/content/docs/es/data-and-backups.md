---
title: Tus datos y las copias de seguridad
description: Dónde guarda tus datos Boopli y cómo hacer una copia de seguridad.
---

Boopli guarda sus datos en el almacenamiento habitual de Home Assistant. Tus copias de seguridad de Home Assistant ya los incluyen.

## Copia de seguridad

La tarjeta **Copia de seguridad** (en Extras) guarda tu configuración en un archivo que termina en .adhd (con los datos en JSON de texto plano). También permite cargar ese archivo, por ejemplo, en una instalación nueva. Selecciona qué quieres incluir: **Configuración**, **Tareas**, **Espacios y notas** y **Mascota e historial**. Las cuatro opciones están seleccionadas por defecto. **Importar** te muestra qué contiene el archivo, qué cambiaría y qué dispositivos faltan en esta instalación. Cuando confirmas, reemplaza las partes que seleccionaste. Si importas tareas, Boopli detiene las que están en curso y no aparecen en la copia. Boopli comprueba el archivo antes de hacer cambios. La copia deja fuera las tareas en curso, el modo ausencia y los archivos de imagen. Guarda el archivo en un lugar privado. Puede incluir nombres de dispositivos y notas sobre tus espacios. Solo quienes tienen permisos de administración pueden exportar o importar.

Si usas [Ayuda con IA](/Boopli/es/ai-help/) o [Preguntar a Claude](/Boopli/es/ask-claude/), el servicio de IA que elijas recibe la tarea, tus respuestas y las notas de espacios o fotos que compartas. Si el servicio funciona en la nube, el proveedor puede conservar esos datos. Boopli borra sus propios archivos temporales de fotos al terminar la consulta.
