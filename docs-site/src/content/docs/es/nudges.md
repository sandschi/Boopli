---
title: Recordatorios
description: Luces, altavoces, dispositivos de alarma y teléfonos, desde un aviso suave hasta una alarma.
---

Cuando te toca hacer un paso, Boopli te envía recordatorios por los canales que actives en la pestaña **Configuración**.

### Luces

En cada luz puedes elegir **Parpadeo** o **Luz de estado (encendida hasta que termines)**. En modo Parpadeo, Boopli guarda el estado actual de la luz y muestra el color que elijas durante el tiempo que indiques (en milisegundos). Lo repite de 1 a 5 veces, con la pausa que indiques, y después deja la luz como estaba. Si la luz estaba apagada, Boopli vuelve a apagarla después del parpadeo. Si recuerda el último color, lo restaura antes de apagarla. En modo Luz de estado, la luz se queda encendida de un color hasta que termines. Algunas luces dicen que admiten la función de destello, pero no responden cuando se usa. Por eso, Boopli hace parpadear la luz directamente. Selecciona **Probar** para ver cómo responde. Una luz de tu red local puede responder en unos cientos de milisegundos. Una luz conectada a la nube necesita alrededor de un segundo o más.

### Altavoces

Puedes añadir cualquier reproductor multimedia. Cada altavoz tiene tres niveles que puedes activar o desactivar: un sonido breve, una frase leída en voz alta y un sonido de alarma que se repite durante el tiempo que indiques. El altavoz reproduce el nivel más alto que se haya alcanzado. Elige un sonido de Alexa de la lista **Sonido** o usa un archivo de la carpeta de medios de Home Assistant (por ejemplo, `boopli/ding.mp3`). Para leer en voz alta, puedes usar Alexa Media Player, una entidad de notificación de Alexa Devices o una voz de lectura en el altavoz. Selecciona **Probar sonido breve**, **Probar lectura** o **Probar alarma** para probar los sonidos.

### Dispositivos de alarma

Puedes usar una sirena, un interruptor o un script. Boopli lo activa durante el tiempo que indiques y luego lo desactiva. También lo desactiva cuando respondes al recordatorio y cuando Home Assistant se reinicia.

### Niveles

En los ajustes de cada canal hay tiempos por defecto para los recordatorios. Por ejemplo, **Desde el recordatorio** en los ajustes de un altavoz indica a partir de qué recordatorio suena. Usa **Cadenas de recordatorios** para seleccionar qué dispositivos actúan en cada recordatorio.

### Teléfonos

La aplicación de Home Assistant envía una notificación con los botones **Listo** y **Posponer**. Puedes seleccionar el nivel: **Notificación normal**, **Notificación de prioridad alta**, **Volumen de la alarma** o **Volumen máximo de la alarma (solo en teléfonos compatibles)**.

### Estilos para cada tarea

**Sin recordatorios** (solo aparece en el panel), **Un recordatorio**, **Recordatorios progresivos** (30, 15, 10 y luego cada 5 minutos hasta que se detienen) o **Recordatorios repetidos** (cada 5 minutos hasta que termines).

### Cadenas de recordatorios

Abre **Cadenas de recordatorios** en Configuración para crear las tuyas. Una cadena es una lista de hasta 12 recordatorios. En cada uno eliges cuánto espera Boopli y qué teléfono (y con qué volumen), luz, altavoz y dispositivo de alarma actúan. Por ejemplo, puedes dejar fuera las luces del recordatorio 2 o usar solo el teléfono al principio. Una luz puede usar **Parpadeo** o **Luz de estado (sigue encendida hasta que respondas)**, con su propio color o con el que elijas para ese recordatorio. Un altavoz reproduce una sola cosa por recordatorio. Puede ser un sonido breve, un sonido guardado en **Tus propios sonidos**, una frase leída en voz alta, **Voz con tono** (un anuncio de Alexa) o la alarma. La guía te pregunta si quieres crear, editar o eliminar una cadena.

### Un color para cada tarea

En el editor puedes darle a cada tarea su propio color de luz (rojo para las pastillas, azul para lavar la ropa). Así puedes reconocer la tarea por el color de la luz de estado. Primero se usa el color de la tarea. Si no hay, se usa el del recordatorio y, si tampoco hay, el de la luz. El selector de color solo aparece si la luz puede mostrar colores. Todas las luces pueden parpadear, porque Boopli las hace parpadear directamente. Una cadena puede detenerse tras el último recordatorio o repetirlo. Selecciona una cadena como estilo de recordatorio de una tarea o como estilo por defecto para las tareas nuevas. La cadena marca los tiempos de los recordatorios de esa tarea. Si quieres eliminar una cadena, primero cambia el estilo de todas las tareas que la usan. Cámbialo también en los ajustes por defecto si la cadena está seleccionada allí.

### Horas de silencio

Están desactivadas por defecto. Puedes elegir distintas horas de inicio y fin para cada día de la semana. Puedes dejar una tarea fuera de ese horario, por ejemplo, la de tomar pastillas.

### Presencia (opcional)

En casa, Boopli usa todos los canales que activaste. Si estás fuera, solo usa el teléfono para las tareas marcadas con **En cualquier lugar (por ejemplo, tomar pastillas)**. Si no configuras una fuente de presencia, Boopli da por hecho que estás en casa.

### Posponer

Retrasa el próximo recordatorio (15 minutos por defecto). El paso sigue pendiente. No hay una opción para descartar el recordatorio.


### Estilos incluidos y tus propios sonidos

Los tres estilos incluidos, **Un recordatorio**, **Recordatorios progresivos** y **Recordatorios repetidos**, son cadenas de recordatorios como las que creas tú. Puedes cambiarlas, pero no eliminarlas. Tus propios sonidos (archivos o sonidos de Alexa a los que pones nombre) están en una lista compartida. Puedes elegirlos para cualquier altavoz.
