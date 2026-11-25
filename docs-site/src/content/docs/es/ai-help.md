---
title: Ayuda con IA
description: Divide una tarea en pasos muy pequeños con tu propio agente de IA de Home Assistant.
---

Si quieres una segunda opinión o no tienes un agente, consulta también [Preguntar a Claude](/Boopli/es/ask-claude/).

Boopli puede dividir una tarea grande, como «limpiar mi habitación», en pasos muy pequeños con **tu propio agente de IA de Home Assistant**. Para ello usa la integración Tarea de IA de Home Assistant. La ayuda con IA está desactivada por defecto. En Configuración, abre **Ayuda con IA** y selecciona **Opciones avanzadas** y **Activar la ayuda con IA**. Selecciona tu agente de IA y guarda los cambios. Vuelve a abrir **Opciones avanzadas** en la tarjeta y selecciona **Probar el agente de IA**. También puedes seguir la guía con **Paso a paso**.

![La ventana Ayuda con IA en Configuración](/Boopli/img/ai-help.jpg)

### Dos formas de empezar

En Hoy, escribe lo que quieres hacer. Selecciona **Dividir en pasos ahora** para una tarea de una sola vez que desaparece al terminarla, o **Dividir una tarea que se repite** para terminar en el asistente de horarios. En la pestaña Tareas tienes **Nueva tarea con IA**. Dentro del editor de tareas, **Sugerir pasos con IA** rellena los pasos de la tarea.

### La IA pregunta primero

Una tarea clara como «sacar la basura» pasa directamente a los pasos. Si la tarea tiene varias partes, la IA pregunta lo que necesita saber. Por ejemplo, qué hay en el espacio, cómo está y cuánta energía tienes. Cada pregunta tiene botones (si hay una lista, puedes seleccionar más de uno) y un cuadro para responder con tus propias palabras. Siempre tienes un cuadro **¿Hay algo más que deba saber?** y un botón **Sugerir pasos ahora**. El agente de IA hace más preguntas para una tarea que se repite, porque la configuras una vez y la vuelves a usar.

### Pasos pequeños y en orden

Cada paso es una acción concreta. El primero es el más fácil para empezar. Los pasos se agrupan por zona (mesa, sillas, piso…) y la IA puede indicar si hay que esperar un tiempo. Una tarea puede tener hasta 50 pasos. La tarea solo se crea cuando revisas los pasos, haces los cambios que necesites y eliges usarlos.

### Tamaños de los pasos y XP

Cada paso es pequeño, mediano o grande (P, M, G) y vale 10, 15 o 20 XP. Los pasos que escribes tú son pequeños. Hoy muestra el grupo, un contador como «Paso 3 de 8» con una barra de progreso y una celebración cuando terminas la tarea.

### Se guarda para la próxima vez

Lo que la IA aprende sobre una tarea que se repite se guarda con la tarea. Puedes editarlo. La IA vuelve a usarlo cuando seleccionas **Sugerir pasos con IA**.

### Puedes ver cuánto llevas esperando

Mientras el agente trabaja, Boopli muestra una animación, el tiempo que ha pasado, el máximo que esperará (3 minutos) y una barra con el progreso de la espera. También te indica con calma que el agente va despacio y sigue trabajando. **Dejar de esperar** te lleva de vuelta y conserva todo lo que escribiste. Si la respuesta llega tarde, Boopli la ignora.

### Habla de tu hogar en tu propio chat con IA

**En mi chat con IA** (para un espacio) y **Hablar de todo mi hogar en mi chat con IA** te dan instrucciones listas para copiar en cualquier chat. Por ejemplo, puedes usar uno con el que puedas hablar por voz. Cuando le dices que terminaste, el chat responde con notas en texto sencillo. Pégalas de vuelta en Boopli. Boopli quita las viñetas, el formato de Markdown y las marcas de los bloques de código. Si las notas son de todo tu hogar, las separa por los encabezados `## Room` y te muestra todo para que lo revises antes de guardar. Tú decides qué compartes al pegar el texto en tu propio chat. Esto funciona con la ayuda con IA desactivada.

### Servicio

`boopli.break_down` (`task` y, como campos opcionales, `kind`, `answers`, `notes` y `rooms`) devuelve los pasos para tus propias automatizaciones y asistentes de voz. Si omites `rooms`, Boopli deduce los espacios a partir de la tarea, igual que en el panel. Consulta también [Servicios, eventos y sensores](/Boopli/es/automations/).

### Tú decides qué instrucciones usar

En la ventana **Opciones avanzadas** de la tarjeta Ayuda con IA, abre **Opciones avanzadas: agente de IA para fotos e instrucciones**. Puedes leer, cambiar y restablecer las dos instrucciones que envía Boopli (para preguntas y para pasos) y los dos textos que copias en tu propio chat con IA (para un espacio o para todo tu hogar). Las instrucciones que vienen con Ayuda con IA piden un solo objeto JSON. Están en inglés y Boopli le pide al agente de IA que responda en el idioma de Home Assistant.

## Privacidad

Por su cuenta, Boopli no envía nada a ningún servicio de IA. Cuando usas Ayuda con IA, Boopli envía el texto de la tarea y tus respuestas al agente de IA que elegiste. Las notas guardadas con una tarea que se repite se pueden volver a usar. También puedes compartir notas de los espacios que selecciones o fotos. Si el agente de IA funciona en la nube, el proveedor recibe lo que compartas y puede conservarlo. Boopli borra sus propios archivos temporales de fotos al terminar la consulta. Boopli deja fuera de la consulta los nombres de tus dispositivos, el historial de Home Assistant y tu ubicación. Lo que escribas o fotografíes puede contener datos privados. Si el agente de IA falla, Boopli muestra el motivo que recibe.
