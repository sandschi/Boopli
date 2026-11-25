---
title: Solución de problemas
description: Qué revisar cuando algo falla.
---

## No recibo recordatorios

- Revisa **Horas de silencio** en Configuración. Cada día de la semana tiene su propio horario.
- Revisa **Modo ausencia**. Si está activo, solo pueden enviarte recordatorios las tareas configuradas para seguir activas.
- Selecciona **Probar** junto a la luz, el altavoz, el dispositivo de alarma o el teléfono en Configuración. Si la prueba funciona, ese canal está bien y el problema está en el estilo o en la cadena de recordatorios.
- Una tarea con el estilo **Sin recordatorios** solo aparece en Boopli.
- Si configuraste tu teléfono, comprueba que la aplicación de Home Assistant tiene permiso para enviar notificaciones.

## Una luz hace algo raro

Algunas luces indican que admiten su propia función de destello, pero la ignoran. Boopli hace parpadear la luz directamente y luego la deja tal como estaba. Las luces conectadas a la nube necesitan alrededor de un segundo o más entre cambios. Configura un parpadeo más largo para esas luces.

## El agente de IA no responde o da una respuesta rara

- Abre **Opciones avanzadas** en la tarjeta **Ayuda con IA** y selecciona **Probar el agente de IA**. Si falla, Boopli muestra el motivo que da el agente. Por ejemplo, una cuenta sin saldo, un modelo que ya no está disponible o un tiempo de espera agotado.
- Boopli espera al agente hasta 3 minutos. **Dejar de esperar** conserva todo lo que escribiste.
- Para las fotos, necesitas un agente que pueda analizar imágenes. En la ventana **Opciones avanzadas** de la tarjeta **Ayuda con IA**, abre **Opciones avanzadas: agente de IA para fotos e instrucciones** y selecciona otro **Agente de IA para fotos**.
- Los modelos gratuitos a veces responden con un formato extraño. Boopli recupera los pasos mal formados cuando puede. Selecciona **Intentar de nuevo** para volver a preguntar.

## Preguntar a Claude no funciona

| Lo que dice Boopli | Qué hacer |
|---|---|
| Claude rechazó el token. Crea uno nuevo para la rutina, pégalo en Boopli e inténtalo de nuevo. | Crea el token nuevo en claude.ai. |
| Claude no encontró la rutina. Revisa la dirección para iniciarla. | Comprueba que la URL termina en `/fire`. |
| Claude ha limitado las consultas por ahora. Inténtalo de nuevo en un rato. | Espera antes de enviar otra consulta. |
| Claude no aceptó la solicitud. Revisa que la rutina esté activada. | Abre la rutina en claude.ai para comprobarlo. |
| Claude tiene problemas en este momento. Inténtalo de nuevo en unos minutos. | Espera antes de enviar otra consulta. |
| Boopli no pudo conectarse con Claude. Revisa la conexión a internet. | Revisa la conexión a internet de Home Assistant. |
| Boopli dejó de esperar la respuesta de Claude. El tiempo máximo de espera es de 2 minutos. Inténtalo de nuevo. | Comprueba si la rutina puede conectarse a Home Assistant. Mira más abajo. |
| Home Assistant no tiene una dirección web a la que Claude pueda conectarse. Añade la dirección en «Preguntar a Claude» o configura la URL externa en Home Assistant. | Configura la URL externa en Home Assistant o usa **Opciones avanzadas: dirección web de Home Assistant** en Preguntar a Claude. |
| Boopli alcanzó el límite de 20 consultas a Claude por hora. Puedes intentarlo de nuevo en unos 5 minutos. | Espera el número de minutos indicado. |

**La rutina se ejecuta, pero no llega ninguna respuesta**. El entorno de la rutina debe permitir la dirección de Home Assistant. Configura el acceso a la red como **Limitado** y permite ese host. La dirección tiene que funcionar desde internet. Una dirección que solo funciona en casa no basta. Abre la ejecución en claude.ai para ver qué hizo la rutina.

**La prueba funciona, pero las fotos fallan**. La rutina descarga las fotos desde un enlace a tu dirección de Home Assistant. Esa dirección también debe estar permitida en el entorno.

## No se guardaron mis ajustes

Los cambios en Configuración son borradores hasta que seleccionas **Guardar**. La barra de abajo indica qué tarjetas tienen cambios sin guardar. Si sales de la página con cambios pendientes, puedes elegir **Guardar**, **Descartar** o **Quedarme**.

## Otro problema

En Home Assistant, ve a **Configuración → Sistema → Registros** y busca `boopli`. Si encuentras un error, abre un reporte en [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues). Indica qué versiones de Boopli y Home Assistant usas y qué dice el registro.
