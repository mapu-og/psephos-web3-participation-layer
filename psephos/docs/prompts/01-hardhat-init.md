# Prompt: Inicializar Hardhat + Configurar proyecto

## Contexto
Estoy construyendo una plataforma de encuestas pagadas on-chain para el Ethereum Developer Bootcamp de Alchemy University. El proyecto vive en `alchemy-final/`.

## Task
Inicializa un proyecto Hardhat completo en este directorio con la siguiente configuración:

### Requisitos
- Hardhat con TypeScript (hardhat.config.ts)
- Solidity `^0.8.20`
- OpenZeppelin Contracts 5.x
- Networks: hardhat (local), Base Sepolia (chainId 84532)
- Variables de entorno con dotenv (PRIVATE_KEY, BASE_SEPOLIA_RPC_URL)
- Plugin: `@nomicfoundation/hardhat-toolbox`
- Crear `.env.example` con las variables necesarias (sin valores reales)
- Crear `.gitignore` adecuado (node_modules, cache, artifacts, .env)

### Estructura esperada
```
alchemy-final/
├── contracts/         (vacío por ahora, el contrato viene en el siguiente task)
├── test/              (vacío)
├── scripts/           (vacío)  
├── deploy/            (vacío)
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
```

### Criterio de "done"
- `npm install` completa sin errores
- `npx hardhat compile` ejecuta sin errores (aunque no haya contratos)
- `npx hardhat test` ejecuta sin errores (aunque no haya tests)

### No hacer
- No crear contratos
- No crear tests
- No crear scripts de deploy
- No instalar librerías de frontend
- No agregar networks que no sean hardhat y Base Sepolia
