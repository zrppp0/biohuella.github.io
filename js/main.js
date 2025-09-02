document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración del Clima ---
    // IMPORTANTE: Reemplaza 'TU_API_KEY' con tu propia clave de OpenWeatherMap.
    const apiKey = 'c9573a063a6260d7b688d02aea1dc299';
    const city = 'Manizales';
    const countryCode = 'CO';
    const lang = 'es';
    const units = 'metric'; // Para grados Celsius

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryCode}&appid=${apiKey}&lang=${lang}&units=${units}`;

    // --- Elementos del DOM ---
    const temperaturaEl = document.getElementById('temperatura');
    const estadoCieloEl = document.getElementById('estado-cielo');

    // --- Función para obtener el clima ---
    async function getClima() {
        // Verificar si hay datos personalizados del admin
        const customWeatherDisplay = localStorage.getItem('currentWeatherDisplay');
        if (customWeatherDisplay) {
            const weatherData = JSON.parse(customWeatherDisplay);
            temperaturaEl.textContent = weatherData.temperatura;
            estadoCieloEl.textContent = weatherData.estado;
            return;
        }
        
        // Mostrar indicador de carga
        temperaturaEl.textContent = 'Cargando...';
        estadoCieloEl.textContent = 'Obteniendo datos del clima...';
        
        console.log('🌤️ Obteniendo datos del clima para Manizales...');

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Error en la API: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Actualizar el DOM con los datos del clima
            temperaturaEl.textContent = `${Math.round(data.main.temp)}°C`;
            estadoCieloEl.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);

        } catch (error) {
            console.error("No se pudo obtener el clima:", error);
            temperaturaEl.textContent = '20°C'; // Temperatura de ejemplo para Manizales
            estadoCieloEl.textContent = 'Datos no disponibles';
        }
    }

    // --- Event listeners para actualizaciones desde el panel admin ---
    window.addEventListener('weatherUpdate', (event) => {
        const weatherData = event.detail;
        temperaturaEl.textContent = `${Math.round(weatherData.temperatura)}°C`;
        estadoCieloEl.textContent = weatherData.estado.charAt(0).toUpperCase() + weatherData.estado.slice(1);
    });

    window.addEventListener('weatherReset', () => {
        getClima(); // Volver a cargar datos de la API
    });

    // --- Llamada inicial ---
    getClima();
    
    // --- Cargar contenido dinámico ---
    loadDynamicContent();

    // --- Smooth Scroll para la navegación interna ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // --- Navegación mejorada para páginas externas ---
    document.querySelectorAll('nav a:not([href^="#"]):not(.admin-link)').forEach(link => {
        link.addEventListener('click', function(e) {
            // Agregar efecto de transición suave
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

// ========== CARGA DE CONTENIDO DINÁMICO ==========
function loadDynamicContent() {
    loadInitiativesFromAdmin();
    loadEventsFromAdmin();
}

function loadInitiativesFromAdmin() {
    const initiatives = JSON.parse(localStorage.getItem('siteInitiatives') || '[]');
    const initiativesContainer = document.querySelector('#iniciativas');
    
    if (!initiativesContainer) return;
    
    // Filtrar solo iniciativas activas
    const activeInitiatives = initiatives.filter(i => i.status === 'activa');
    
    if (activeInitiatives.length === 0) {
        // Mantener el contenido por defecto si no hay iniciativas del admin
        return;
    }
    
    // Reemplazar el contenido de iniciativas con el contenido del admin
    const newsItems = initiativesContainer.querySelectorAll('.news-item');
    newsItems.forEach(item => item.remove());
    
    activeInitiatives.forEach(initiative => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.innerHTML = `
            <p><strong>${initiative.icon} ${initiative.title}:</strong> ${initiative.description}</p>
        `;
        initiativesContainer.appendChild(newsItem);
    });
}

function loadEventsFromAdmin() {
    const events = JSON.parse(localStorage.getItem('siteEvents') || '[]');
    
    // Filtrar eventos próximos (en los próximos 30 días)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= thirtyDaysFromNow;
    });
    
    if (upcomingEvents.length === 0) return;
    
    // Crear una nueva sección de eventos próximos si no existe
    let eventsSection = document.getElementById('eventos-proximos');
    if (!eventsSection) {
        eventsSection = document.createElement('section');
        eventsSection.id = 'eventos-proximos';
        eventsSection.innerHTML = `
            <h2>🗓️ Eventos Próximos</h2>
            <div class="events-container"></div>
        `;
        
        // Insertar antes de la sección de iniciativas
        const iniciativasSection = document.getElementById('iniciativas');
        iniciativasSection.parentNode.insertBefore(eventsSection, iniciativasSection);
    }
    
    const eventsContainer = eventsSection.querySelector('.events-container');
    eventsContainer.innerHTML = '';
    
    upcomingEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'news-item';
        eventItem.innerHTML = `
            <p><strong>${getEventTypeIcon(event.type)} ${event.title}:</strong> ${event.description}</p>
            <div class="event-meta" style="margin-top: 1rem; font-size: 0.9rem; color: var(--sky-blue);">
                <span>📅 ${new Date(event.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
                <br>
                <span>📍 ${event.location}</span>
            </div>
        `;
        eventsContainer.appendChild(eventItem);
    });
}

function getEventTypeIcon(type) {
    const icons = {
        'taller': '🔧',
        'conferencia': '🎤',
        'festival': '🎪',
        'limpieza': '🧹',
        'siembra': '🌱'
    };
    return icons[type] || '📅';
}

// Escuchar cambios en localStorage para actualizar el contenido dinámicamente
window.addEventListener('storage', (e) => {
    if (e.key === 'siteInitiatives' || e.key === 'siteEvents') {
        loadDynamicContent();
    }
});

// También actualizar cuando se modifica desde el mismo origen
setInterval(() => {
    loadDynamicContent();
}, 5000); // Actualizar cada 5 segundos
