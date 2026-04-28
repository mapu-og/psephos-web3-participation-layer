# Resumen de mejoras y entregables — Psephos

## Diagnóstico y cambios implementados

### 1. Coherencia visual global
- RainbowKit usa tema dark y acento cyan (#00E5CC) para integrarse con Psephos.
- Selector de fecha (`datetime-local`) estilizado para coincidir con el diseño.
- Toast y badge MapuriteLabs con gradiente y animación sutil.

### 2. Orden cronológico
- Las encuestas activas se muestran de más nuevas a más antiguas (orden por id descendente).

### 3. Historial por survey
- Sección de historial en cada encuesta: muestra creación, respuestas, claims y cierre, usando eventos reales del contrato.
- Incluye timestamp, dirección abreviada y link a la transacción en BaseScan.

### 4. Footer
- Footer mejorado con badge animado “MapuriteLabs” adaptado al diseño Psephos.

### 5. Feedback al enviar firma
- Toast visual moderno y consistente aparece al enviar respuesta o claim exitoso, con mensaje y subtexto.

### 6. V1.5 de producto sin cambiar contrato
- El usuario ya no escribe manualmente hashes de IPFS al crear ni al responder.
- El frontend genera JSON de metadata/respuesta, lo sube a IPFS y solo guarda el CID en el contrato existente.
- Soporte de frontend para tres modos: `survey`, `poll` y `vote`.
- `poll` y `vote` usan opciones predefinidas; `vote` agrega `Blank Vote` en metadata.
- Seccion discreta `Proof / Technical details` en el detalle para revisar CIDs y links de gateway.
- Compatibilidad hacia atras: encuestas viejas sin metadata estructurada siguen funcionando como `survey`.

---

## Riesgos o limitaciones
- El historial solo muestra eventos que existen en el contrato (no inventa acciones).
- El toast no es global, solo aparece en la página de detalle de encuesta.
- El calendar picker depende del soporte de los navegadores para `datetime-local`.
- Los tipos `survey/poll/vote` viven en metadata frontend; el contrato no los valida on-chain.
- Las opciones predefinidas se validan en frontend/API, no en Solidity.
- Las respuestas subidas a IPFS no estan cifradas.
- No se tocó la lógica de contratos ni se agregaron campos nuevos.

---

## Verificación básica
- La lógica de participación, claim y visualización de encuestas sigue funcionando.
- El build pasa limpio.
- Los tests del contrato siguen pasando sin cambios.
- El diseño es coherente en todos los componentes principales.
- El historial y el toast usan solo datos reales del contrato.
- El detalle resuelve metadata nueva y mantiene fallback legacy para encuestas anteriores.

---

## Pendientes o bloqueos
- Subida a GitHub y presentación (no implementados, pero listos para ejecutar).
- Si se quiere un sistema de notificaciones global, habría que refactorizar el toast a un provider global.
- Si se quiere enforcement real de tipos/opciones en cadena, hará falta una V2 del contrato.

---

## Propuesta de producto (futuro)

### Opciones y recomendaciones
- **Question-first UI:** Mantener la pregunta como campo principal en UI y dejar IPFS como detalle tecnico.
- **Tipos de formulario:** En esta fase ya existen `survey/poll/vote` en frontend; validar despues si conviene formalizarlos on-chain.
- **Smart contract V2:** Solo si se necesita enforcement real de tipo, opciones o privacidad de respuestas.
- **Privacidad:** Si aparecen casos sensibles, evaluar cifrado o esquemas de acceso para contenido en IPFS.
- **Orden sugerido:**
  1. Validar con usuarios si la taxonomia `survey/poll/vote` resulta clara.
  2. Medir si hace falta mostrar resultados agregados en UI.
  3. Si se requiere enforcement en cadena, disenar V2 del contrato.
  4. Si aparecen casos sensibles, evaluar privacidad/cifrado para respuestas.

---

## Ideas para el futuro (no implementadas)
- Multichain: Ethereum, Solana, Sui.
- Mensajes públicos, directos, secretos, anónimos, confesiones.
- Proof of humanity: encuestas para humanos y bots.
- Proof of Message NFTs: mintear mensajes como NFTs.
- Resultados con gráficas.
- Share buttons: integración social y referidos.
