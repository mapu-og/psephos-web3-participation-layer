---
name: create-git-repo
description: "Agente para guiar y ejecutar los pasos mínimos para inicializar un repositorio Git + remote GitHub desde este proyecto. Uso: comandos de terminal, convenciones de commit, y verificación del URL para Project Github URL."
applyTo: "**/*"
---

# Agente: create-git-repo

Este agente está especializado en un único objetivo:
- Inicializar un repositorio Git local
- Crear el remote GitHub si se desea
- Hacer commits básicos
- Comprobar estado y el URL final de GitHub para la entrega

## Instrucciones de uso

1. Pregunta al usuario:
   - Nombre del repositorio (por ejemplo: `alchemy-final` o `bootcamp-project`).
   - Usuario/organización GitHub.
   - Si ya tiene un repo remoto creado o no.
   - Si quiere un flujo de push automático (yes/no).

2. Flujo de comando sugerido (shell):
   - `git init`
   - `git add .`
   - `git commit -m "chore: inicio de proyecto"`
   - `git branch -M main`
   - `git remote add origin https://github.com/<usuario>/<repo>.git`
   - `git push -u origin main`

3. Verificación:
   - `git status`
   - `git remote -v`
   - `git config --get remote.origin.url`

4. Salida final:
   - Mensaje con el Project Github URL listo para pegar en Alchemy.

## ¿Cuándo usar este agente?

- Al arrancar el proyecto y querer asegurarte de que el flujo Git está correcto.
- Antes de la entrega para confirmar que el repo remoto existe y es accesible.

## Exclusiones

- No gestiona ramas avanzadas (feature/release).
- No crea issues ni workflows CI/CD (puede extenderse en otro agente).

