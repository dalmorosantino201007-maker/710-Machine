// --- En la lista de comandosManuales dentro del evento 'ready' ---
const comandosManuales = [
    { 
        name: 'reseller', 
        description: 'Da el rol de reseller y cambia el apodo del usuario',
        options: [
            {
                name: 'usuario',
                type: 'USER',
                description: 'El usuario que será reseller',
                required: true
            }
        ]
    },
    // ... tus otros comandos
];