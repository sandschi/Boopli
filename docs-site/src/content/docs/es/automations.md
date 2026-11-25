---
title: Servicios, eventos y sensores
description: Crea tus propias automatizaciones con Boopli.
---

Boopli ofrece tres cosas para tus automatizaciones, scripts y asistentes de voz: servicios que puedes llamar, eventos que puedes escuchar y sensores de tu mascota.

## Servicios

| Servicio | Qué hace |
|---|---|
| `boopli.break_down` | Divide una tarea en pasos pequeños con tu agente de IA y devuelve los pasos. Requiere que la ayuda con IA esté activada. Campos: `task` y, como campos opcionales, `kind` (`now` o `recurring`), `answers`, `notes` y `rooms`. Si omites `rooms`, Boopli deduce los espacios a partir de la tarea, igual que en el panel. |
| `boopli.add_task` | Crea una tarea de una sola vez, con pasos si quieres, y la inicia. La tarea desaparece al terminarla. |
| `boopli.start_chore` | Inicia una tarea ahora, por su nombre o ID. |
| `boopli.complete_step` | Marca como completado el paso que te toca en una tarea. |
| `boopli.snooze_step` | Pospone el paso que te toca en una tarea. |
| `boopli.step_on_it` | Le indica a Boopli que estás trabajando en el paso que te toca («Estoy en ello»). |
| `boopli.step_not_on_it` | Reanuda los recordatorios después de «Estoy en ello». |
| `boopli.delete_chore` | Elimina una tarea y todo lo que esté en curso en ella. |
| `boopli.set_away` | Activa el [Modo ausencia](/Boopli/es/away-mode/). Los campos `start` y `until` son opcionales. Por ejemplo, `2026-11-28 08:00`. |
| `boopli.end_away` | Desactiva el modo ausencia. |

Los servicios que reciben una tarea (`chore`) aceptan su nombre o su ID. Si dos tareas tienen el mismo nombre, usa el ID.

## Eventos

Estos eventos se emiten en el bus de eventos de Home Assistant. Puedes usarlos para iniciar una automatización.

| Evento | Cuándo |
|---|---|
| `boopli_chore_started` | Empezó una tarea. |
| `boopli_questions_answered` | Respondiste las preguntas de una tarea antes de que empezara. |
| `boopli_step_active` | Te toca hacer un paso. |
| `boopli_step_on_it` | Seleccionaste **Estoy en ello** en un paso. |
| `boopli_step_done` | Se completó un paso. `by` indica `manual` o `auto` y `reason` indica qué ocurrió. |
| `boopli_chore_done` | Se completaron todos los pasos de una tarea. |
| `boopli_nudge_sent` | Boopli te envió un recordatorio. |
| `boopli_xp_gained` | Ganaste XP. |
| `boopli_away_started` | Empezó el modo ausencia. |
| `boopli_away_ended` | Terminó el modo ausencia. |

## Sensores

Boopli añade un dispositivo llamado **Boopli** con tres sensores de tu mascota:

- **XP**. El total de XP que tiene tu mascota.
- **Nivel**. El nivel de tu mascota.
- **Estado de ánimo**. Feliz, a gusto, con sueño, triste o en un sueño profundo.

Puedes mostrarlos en un panel o usarlos en automatizaciones. Por ejemplo, puedes poner una luz verde cuando tu mascota esté feliz.
