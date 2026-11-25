---
title: Instalar Boopli
description: Instala Boopli con HACS o de forma manual y añádelo a Home Assistant.
---

Boopli es una integración personalizada para Home Assistant. Puedes usar sus tareas y recordatorios con la configuración de Home Assistant que ya tienes.

## Con HACS

1. Abre HACS y añade `https://github.com/sandschi/Boopli` como repositorio personalizado de tipo **Integración**. Este botón lo hace por ti.

   [![Abre tu instancia de Home Assistant y este repositorio en HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sandschi&repository=Boopli&category=integration)

2. Descarga Boopli en HACS y reinicia Home Assistant.

## De forma manual

Copia la carpeta `custom_components/boopli` del repositorio a la carpeta `custom_components` de tu configuración de Home Assistant. Después, reinicia Home Assistant.

## Añadir Boopli a Home Assistant

Ve a **Configuración → Dispositivos y servicios → Añadir integración** y selecciona **Boopli**. También puedes usar este botón.

[![Abre tu instancia de Home Assistant y empieza a configurar Boopli.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=boopli)

Boopli aparece como un panel en la barra lateral de Home Assistant. La primera vez que lo abras, verás el asistente de configuración. El panel, la ventana de configuración y las descripciones de los servicios están disponibles en inglés (en), alemán (de), neerlandés (nl), francés (fr) y español (es). Sigue con [Configurar Boopli](/Boopli/es/setup/).
