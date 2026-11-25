---
title: Tareas y horarios
description: Tipos de tareas, horarios y pasos que esperan, hacen preguntas o se completan automáticamente.
---

## Horarios de las tareas

Puedes elegir entre tres tipos de tareas.

- **Cuando quieras**. Tú decides cuándo empezarla.
- **En ciertos días y a ciertas horas**. Cada día de la semana puede tener sus propias horas o quedar sin horario. Puedes configurar cada día por separado, sin agruparlos en «días laborables» y «fin de semana». Un día puede tener hasta seis horas de inicio. Por ejemplo, tomar las pastillas a las 08:00 y a las 20:00, o poner el lavavajillas de lunes a viernes a las 19:30 y el sábado a las 11:00. En el editor de tareas, cada día tiene su propia fila con la casilla **Con horario**, sus horas y un botón como **Igual que el lun**.
- **Un número fijo de días después de terminarla**. La tarea vuelve a aparecer N días después de la última vez que la terminaste, a la hora que elijas.

Si llega la hora de una tarea y la anterior sigue pendiente, Boopli salta ese turno para que no se acumulen.

**Asistente de horarios**. En el editor de tareas, el botón **Definir horario paso a paso** abre un asistente. Puedes elegir con qué frecuencia se repite la tarea, qué días y a qué hora cada día. Luego ves las próximas cinco veces que se iniciará, calculadas por la propia integración, y una última pantalla con los cambios. En la lista de Tareas, las tareas sin horario tienen un botón **Definir horario**. Ese botón abre el asistente directamente y guarda la tarea cuando terminas. Si lo abres desde el editor, el asistente solo rellena el formulario. La barra de cambios sin guardar te avisa de que tienes que guardar.

## Pasos que esperan o hacen preguntas

### Partes de una tarea y cómo dejarlas para más tarde

Los pasos se agrupan en partes («Escritorio», «Sofá», «Suelo»). Una tarea para un espacio entero tiene una parte completa por cada cosa que aparece en sus notas. En Hoy, **Dejar esta parte para más tarde** convierte los pasos pendientes de una parte en una tarea pequeña («Limpiar la sala de estar: Escritorio»). Elige **La empezaré por mi cuenta**, **Mañana, 9:00** o **Elegir hora**. No se pierde nada y nada queda atrasado. La parte espera en **Para más tarde**, con **Empezar ahora**, **Cambiar hora** y **Eliminar**. Se inicia sola a su hora, con los recordatorios y XP de siempre. Puedes dejar para más tarde una parte entera, salvo la última de una tarea. Para un paso suelto, usa Posponer.

### Esperar a que pase esto

Un paso puede esperar a que ocurra algo, además de esperar unos minutos. «Esperar a que pase esto…» admite los mismos activadores que «Se completa automáticamente cuando…»: el estado o el valor numérico de una entidad, una etiqueta NFC, un botón o una entidad de evento. El paso espera sin recordatorios hasta que se produce uno de los activadores. Entonces te toca hacerlo. Los minutos indican el tiempo máximo de espera (0 = lo que haga falta). Por ejemplo, «Tender la ropa» puede esperar a que la lavadora envíe el evento «ciclo terminado». Cada paso del editor de tareas también tiene el campo **Parte de la tarea (opcional)** para que puedas definir tus propias partes.

### Preguntas antes de empezar

Si una tarea con preguntas se inició sola, en Hoy verás esas preguntas en **Primero, un vistazo**.

Una tarea puede hacerte preguntas de sí o no cada vez que empieza («¿Hay que despejar la mesa?»), porque las cosas pueden cambiar de un día para otro. Un paso asociado a una pregunta (campo **Solo si:**) aparece solo si respondes **Sí** (verde). Si respondes **No** (rojo), ese paso no aparece. Los pasos que no dependen de ninguna pregunta, como limpiar la mesa, siempre aparecen. Si seleccionas **Empezar ahora**, respondes primero. Si la tarea se inicia sola (por horario, sensor o NFC), empieza enseguida con todos sus pasos. Los activadores y el botón Listo funcionan como siempre. Recibes una notificación en el teléfono con **Conservar todos los pasos** o **Responder las preguntas** (abre Boopli en la aplicación). El primer recordatorio espera a que respondas (30 minutos por defecto, ajustables en Configuración). Si respondes más tarde, Boopli ajusta los pasos que aún no hiciste. Cuando la IA divide una tarea que se repite, puede escribir estas preguntas y la tarea las guarda para la próxima semana. Las automatizaciones reciben las respuestas en los eventos `boopli_chore_started` y `boopli_questions_answered`.

## Pasos que se completan automáticamente

En el editor de tareas, cada paso tiene una sección opcional **Se completa automáticamente cuando…**. Cuando se produce uno de sus activadores, Boopli marca el paso como completado, detiene sus recordatorios (luces, sonidos, alarma y notificación en el teléfono) y sigue adelante. Basta con un solo activador. El botón Listo sigue funcionando siempre.

- **Cambia una entidad**. Elige cualquier entidad y un estado (`on`, `open`, `home`…). Si la entidad tiene un valor numérico, elige un límite e indica si el valor debe quedar por encima o por debajo. También puedes indicar cuántos minutos debe mantenerse así. Por ejemplo, que un sensor detecte que se abre una puerta o que la humedad de la tierra supere 40.
- **Se escanea una etiqueta NFC**. Elige una etiqueta de la lista de Home Assistant o selecciona **Escanear ahora** y acerca el teléfono a la etiqueta.
- **Se pulsa un botón**. Elige cualquier entidad `event`, `input_button` o `button`. Si quieres, limita la condición a un tipo de pulsación (simple o doble).

Por defecto, el activador debe ocurrir **después de que empiece el paso**. Así, una puerta que ya estaba abierta no completa «Abrirla para que se seque». En **Opciones avanzadas** también puedes seleccionar **Contar la condición si ya se cumple al empezar el paso** (por ejemplo, «Las ventanas están cerradas»). En ese caso, el paso se completa al instante y en silencio. Así, no recibes recordatorios por algo que ya está hecho.

Un sensor que no está disponible o cuyo estado se desconoce nunca completa un paso. Los pasos que terminan así aparecen en Hoy, en «Pasos completados automáticamente», junto con lo que ocurrió. Los eventos `boopli_step_done` incluyen `by` (`manual` o `auto`) y `reason`. Si ya se cumplían los requisitos de un activador al reiniciar Home Assistant, Boopli lo vuelve a comprobar. Las pulsaciones o los escaneos que ocurrieron mientras Home Assistant estaba apagado se pierden.

### «Estoy en ello» mientras trabajas

Selecciona **Estoy en ello** en Hoy, en el Wallboard o en la notificación del teléfono para pausar los recordatorios mientras trabajas. La notificación se vuelve verde y queda en silencio. Pasado el tiempo configurado (30 minutos por defecto), Boopli puede enviarte otra notificación para preguntarte cómo vas, con **Listo** y **Sigo en ello**. Para volver a recibir recordatorios, selecciona **Reanudar recordatorios** en Hoy, en el Wallboard o en la notificación del teléfono. Puedes usar las acciones `boopli.step_on_it` y `boopli.step_not_on_it` y el evento `boopli_step_on_it` en tus propias automatizaciones.

### Una imagen con el recordatorio

La notificación de un paso puede incluir una imagen, por ejemplo, del pastillero o de la pantalla de la lavadora. En el editor del paso, abre **Imagen de la notificación…** y selecciona **Una cámara** (el teléfono muestra una captura nueva) o **Un archivo de imagen** de la carpeta de medios de Home Assistant, como `boopli/pills.jpg`. La imagen se conserva cuando seleccionas **Estoy en ello** y en la notificación que pregunta cómo vas. Para verla, el teléfono tiene que poder conectarse a Home Assistant. La imagen es opcional. Si el paso no tiene imagen, recibes la notificación de siempre. La carpeta de medios requiere iniciar sesión para acceder a ella. La carpeta `www` es pública.
