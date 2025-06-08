/**
 * ArtExplorer Lite - Version 1.0
 * Entdecke Kunstwerke aus dem Metropolitan Museum of Art
 * Mit Emoji-Logs - bringt Farbe in den grauen Entwicklungsalltag ;-)
 *
 * Leroy Overdick
 * Semesterarbeit IM2
 *
 */

// Verhindere doppelte Ausführung
if (typeof window.ArtExplorerApp !== 'undefined') {
    console.log('🎨 ArtExplorer bereits geladen - überspringe Initialisierung');
} else {

    // ===== GLOBALE KONFIGURATION =====
    window.ArtExplorerApp = {
        config: {
            API_BASE: 'https://collectionapi.metmuseum.org/public/collection/v1',
            BATCH_SIZE: 6,
            SPLASH_DURATION: 2000,
            INTERSECTION_THRESHOLD: 0.1
        },

        state: {
            artworkPool: [],
            seenArtworks: new Set(),
            isLoading: false,
            currentArtwork: null,
            intersectionObserver: null
        }
    };

    // iOS-spezifische Optimierungen
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        console.log('📱 iOS-Gerät erkannt - Zoom-Schutz aktiviert');

        // Verhindere Zoom bei doppeltem Touch
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // ===== SPLASH SCREEN MODUL =====
    window.ArtExplorerApp.SplashScreen = {
        /**
         * Zeigt den Splash Screen an
         */
        show() {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.style.display = 'flex';
                splash.classList.remove('fade-out', 'hidden');
                console.log('⏳ Splash Screen angezeigt');
            }
        },

        /**
         * Versteckt den Splash Screen mit Animation
         */
        hide() {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                console.log('🎭 Verstecke Splash Screen...');
                splash.style.opacity = '0';
                splash.style.pointerEvents = 'none';
                splash.classList.add('fade-out');

                setTimeout(() => {
                    splash.style.display = 'none !important';
                    splash.style.visibility = 'hidden';
                    splash.classList.add('hidden');
                    splash.style.zIndex = '-1';
                    console.log('✅ Splash Screen erfolgreich versteckt');

                    const mainContent = document.getElementById('mainContent');
                    if (mainContent) {
                        mainContent.style.display = 'block';
                        mainContent.style.visibility = 'visible';
                        mainContent.style.zIndex = '1';
                        console.log('🎯 Hauptinhalt aktiviert');
                    }
                }, 100);
            } else {
                console.error('❌ Splash Screen Element nicht gefunden');
            }
        },

        /**
         * Initialisiert den Splash Screen und lädt erste Daten
         */
        async initialize() {
            console.log('🚀 Splash Screen Initialisierung gestartet');
            this.show();

            // Notfall-Timer um sicherzustellen, dass der Splash verschwindet
            const emergencyHideTimer = setTimeout(() => {
                console.warn('⚠️ Notfall-Verstecken: Splash Screen nach 5 Sekunden forciert');
                this.hide();
            }, 5000);

            try {
                console.log('📡 Lade Kunstwerk-IDs von der API...');
                await window.ArtExplorerApp.ArtworkAPI.loadArtworkIds();
                console.log('✅ Kunstwerk-IDs erfolgreich geladen');

                const splashDuration = 800;
                console.log(`⏱️ Warte ${splashDuration}ms für Splash-Animation...`);
                await new Promise(resolve => setTimeout(resolve, splashDuration));
                console.log('✅ Splash-Animation abgeschlossen');

                clearTimeout(emergencyHideTimer);
                this.hide();

                // Erste Kunstwerke laden
                setTimeout(() => {
                    console.log('🖼️ Starte initiales Laden der Kunstwerke...');
                    window.ArtExplorerApp.ArtworkLoader.loadMoreArtworks().then(() => {
                        console.log('✅ Initiales Kunstwerk-Laden abgeschlossen');

                        // Finale Sicherheitsprüfung
                        setTimeout(() => {
                            const splash = document.getElementById('splashScreen');
                            if (splash && splash.style.display !== 'none') {
                                console.warn('🔧 Finale Prüfung: Splash noch sichtbar - forciere Verstecken');
                                splash.style.display = 'none';
                                splash.style.visibility = 'hidden';
                                splash.style.zIndex = '-9999';
                            }
                        }, 1000);

                    }).catch(error => {
                        console.error('❌ Fehler beim initialen Kunstwerk-Laden:', error);
                    });
                }, 100);

            } catch (error) {
                console.error('❌ Fehler bei Splash Screen Initialisierung:', error);
                clearTimeout(emergencyHideTimer);
                setTimeout(() => {
                    this.hide();
                    window.ArtExplorerApp.UIManager.showError('Fehler beim Laden der Kunstwerke. Die Anwendung wird trotzdem gestartet.');
                }, 1000);
            }
        }
    };

    // ===== THEME MANAGER MODUL =====
    window.ArtExplorerApp.ThemeManager = {
        /**
         * Initialisiert das Theme-System mit gespeicherten Einstellungen
         */
        initialize() {
            console.log('🎨 Initialisiere Theme Manager...');
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

            this.applyTheme(theme);
            this.initializeAccentColor();
            this.bindEvents();
            console.log(`✅ Theme Manager initialisiert (${theme}-Modus)`);
        },

        /**
         * Wendet ein Theme an (light/dark)
         * @param {string} theme - 'light' oder 'dark'
         */
        applyTheme(theme) {
            const root = document.documentElement;
            const navbar = document.getElementById('navbar');
            const themeToggle = document.getElementById('themeToggle');

            if (root) root.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);

            if (themeToggle) {
                if (theme === 'dark') {
                    themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
                    if (navbar) navbar.className = 'navbar navbar-expand-lg navbar-dark position-fixed top-0 w-100';
                } else {
                    themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
                    if (navbar) navbar.className = 'navbar navbar-expand-lg navbar-light position-fixed top-0 w-100';
                }
            }
            console.log(`🎨 Theme gewechselt zu: ${theme}`);
        },

        /**
         * Initialisiert die Akzentfarbe aus den gespeicherten Einstellungen
         */
        initializeAccentColor() {
            const savedColor = localStorage.getItem('accentColor') || '#96a296';
            const root = document.documentElement;
            const picker = document.getElementById('accentPicker');

            if (root) {
                root.style.setProperty('--accent', savedColor);
                root.style.setProperty('--accent-hover', this.darkenColor(savedColor, 0.1));
            }
            if (picker) picker.value = savedColor;
            console.log(`🎨 Akzentfarbe gesetzt: ${savedColor}`);
        },

        /**
         * Bindet Event-Listener für Theme-Steuerung
         */
        bindEvents() {
            const themeToggle = document.getElementById('themeToggle');
            const accentPicker = document.getElementById('accentPicker');

            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    this.applyTheme(newTheme);
                });
            }

            if (accentPicker) {
                accentPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const root = document.documentElement;

                    root.style.setProperty('--accent', color);
                    root.style.setProperty('--accent-hover', this.darkenColor(color, 0.1));
                    localStorage.setItem('accentColor', color);
                    console.log(`🎨 Akzentfarbe geändert: ${color}`);
                });
            }
        },

        /**
         * Verdunkelt eine Farbe um einen bestimmten Faktor
         * @param {string} color - Hex-Farbcode
         * @param {number} amount - Verdunklungsfaktor (0-1)
         * @returns {string} RGB-Farbwert
         */
        darkenColor(color, amount) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            return `rgb(${Math.max(0, r * (1 - amount))}, ${Math.max(0, g * (1 - amount))}, ${Math.max(0, b * (1 - amount))})`;
        }
    };

    // ===== NAVIGATION MANAGER MODUL =====
    window.ArtExplorerApp.NavigationManager = {
        /**
         * Initialisiert das Navigationssystem
         */
        initialize() {
            console.log('🧭 Initialisiere Navigation Manager...');
            this.bindEvents();
            this.showPage('home');
            console.log('✅ Navigation Manager initialisiert');
        },

        /**
         * Bindet Event-Listener für Navigation
         */
        bindEvents() {
            const navLinks = document.querySelectorAll('.nav-link[data-page]');

            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = link.getAttribute('data-page');
                    this.showPage(page);
                    this.setActiveNavLink(link);

                    // Mobile Navigation schließen
                    const navbarCollapse = document.getElementById('navbarNav');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                        if (bsCollapse) bsCollapse.hide();
                    }
                });
            });
            console.log(`🔗 ${navLinks.length} Navigations-Links gebunden`);
        },

        /**
         * Zeigt eine bestimmte Seite an
         * @param {string} pageId - ID der anzuzeigenden Seite
         */
        showPage(pageId) {
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));

            const targetPage = document.getElementById(`${pageId}Page`);
            if (targetPage) {
                targetPage.classList.add('active');
                console.log(`📄 Seite gewechselt zu: ${pageId}`);
            }
        },

        /**
         * Setzt den aktiven Navigations-Link
         * @param {Element} activeLink - Das aktive Link-Element
         */
        setActiveNavLink(activeLink) {
            const navLinks = document.querySelectorAll('.nav-link[data-page]');
            navLinks.forEach(link => link.classList.remove('active'));
            activeLink.classList.add('active');
        }
    };

    // ===== ARTWORK API MODUL =====
    window.ArtExplorerApp.ArtworkAPI = {
        /**
         * Lädt alle verfügbaren Kunstwerk-IDs von der API
         */
        async loadArtworkIds() {
            try {
                console.log('📡 Starte API-Anfrage für Kunstwerk-IDs...');
                const response = await fetch(`${window.ArtExplorerApp.config.API_BASE}/search?q=""&hasImages=true`);

                if (!response.ok) {
                    throw new Error(`API-Antwort nicht erfolgreich: ${response.status}`);
                }

                const data = await response.json();
                console.log(`📊 API-Antwort erhalten: ${data.total} Kunstwerke verfügbar`);

                window.ArtExplorerApp.state.artworkPool = data.objectIDs || [];

                if (window.ArtExplorerApp.state.artworkPool.length === 0) {
                    throw new Error('Keine Kunstwerke in der API-Antwort gefunden');
                }

                console.log(`✅ Kunstwerk-Pool initialisiert mit ${window.ArtExplorerApp.state.artworkPool.length} IDs`);
            } catch (error) {
                console.error('❌ Fehler beim Laden der Kunstwerk-IDs:', error);
                window.ArtExplorerApp.UIManager.showError('Fehler beim Laden der Kunstwerke. Bitte versuchen Sie es später erneut.');

                // Fallback zu leerem Array - keine vordefinierte Liste mehr
                window.ArtExplorerApp.state.artworkPool = [];
                console.log('⚠️ Fallback: Leerer Kunstwerk-Pool verwendet');
            }
        },

        /**
         * Lädt Details eines spezifischen Kunstwerks
         * @param {number} id - ID des Kunstwerks
         * @returns {Object|null} Kunstwerk-Daten oder null bei Fehler
         */
        async loadArtwork(id) {
            try {
                console.log(`🖼️ Lade Kunstwerk-Details für ID: ${id}`);
                const response = await fetch(`${window.ArtExplorerApp.config.API_BASE}/objects/${id}`);

                if (!response.ok) {
                    console.log(`⚠️ Kunstwerk-API-Antwort nicht erfolgreich: ${response.status} für ID: ${id}`);
                    return null;
                }

                const artwork = await response.json();

                // Validierung: Bilder erforderlich
                if (!artwork.primaryImageSmall && !artwork.primaryImage) {
                    console.log(`🚫 Kunstwerk hat keine Bilder: ${id}`);
                    return null;
                }

                // Validierung: Nur Public Domain Kunstwerke
                if (!artwork.isPublicDomain) {
                    console.log(`🔒 Kunstwerk ist nicht Public Domain: ${id}`);
                    return null;
                }

                console.log(`✅ Kunstwerk erfolgreich validiert: ${artwork.title || `ID ${id}`}`);
                return artwork;
            } catch (error) {
                console.error(`❌ Fehler beim Laden von Kunstwerk ${id}:`, error);
                return null;
            }
        },

        /**
         * Wählt eine zufällige Kunstwerk-ID aus dem Pool
         * @returns {number|null} Kunstwerk-ID oder null wenn Pool leer
         */
        getRandomArtworkId() {
            const pool = window.ArtExplorerApp.state.artworkPool;
            if (pool.length === 0) {
                console.warn('⚠️ Kunstwerk-Pool ist leer');
                return null;
            }

            const randomIndex = Math.floor(Math.random() * pool.length);
            const artworkId = pool.splice(randomIndex, 1)[0];
            console.log(`🎲 Zufällige Kunstwerk-ID ausgewählt: ${artworkId} (Pool verbleibend: ${pool.length})`);
            return artworkId;
        }
    };

    // ===== ARTWORK RENDERER MODUL =====
    window.ArtExplorerApp.ArtworkRenderer = {
        /**
         * Rendert HTML für ein Kunstwerk
         * @param {Object} artwork - Kunstwerk-Daten
         * @returns {string} HTML-String für das Kunstwerk
         */
        renderArtwork(artwork) {
            const imageUrl = artwork.primaryImageSmall || artwork.primaryImage;
            const originalTitle = artwork.title || 'Ohne Titel';
            const title = this.truncateTitle(originalTitle, 40);
            const artist = artwork.artistDisplayName || 'Unbekannt';
            const date = artwork.objectDate || '';
            const culture = artwork.culture || '';

            const metaInfo = [artist, date, culture].filter(Boolean).join(' • ');

            return `
      <div class="snap-item" tabindex="0" data-artwork-id="${artwork.objectID}">
        <img src="${imageUrl}" alt="${originalTitle}" loading="lazy">
        <div class="info-overlay">
          <div>
            <h3>
              <a href="${artwork.objectURL}" target="_blank" rel="noopener noreferrer" title="${originalTitle}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Öffnet die Originalseite im Metropolitan Museum">
                ${title}
              </a>
            </h3>
            <div class="meta">${metaInfo}</div>
          </div>
          <div class="info-buttons">
            <button class="btn-google" data-artwork-id="${artwork.objectID}" aria-label="Google Suche für ${originalTitle}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Google-Suche für weitere Informationen">
              <i class="bi bi-search"></i>
            </button>
            <button class="btn-info" data-artwork-id="${artwork.objectID}" aria-label="Details für ${originalTitle} anzeigen" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Detaillierte Informationen zum Kunstwerk anzeigen">
              <i class="bi bi-info-lg"></i>
            </button>
          </div>
        </div>
      </div>
    `;
        },

        /**
         * Kürzt einen Titel auf die maximale Länge
         * @param {string} title - Originaltitel
         * @param {number} maxLength - Maximale Zeichen
         * @returns {string} Gekürzter Titel mit '...' falls nötig
         */
        truncateTitle(title, maxLength) {
            if (title.length <= maxLength) return title;

            const truncated = title.substring(0, maxLength);
            const lastSpaceIndex = truncated.lastIndexOf(' ');

            if (lastSpaceIndex > maxLength * 0.7) {
                return truncated.substring(0, lastSpaceIndex) + '...';
            }

            return truncated.substring(0, maxLength - 3) + '...';
        }
    };

    // ===== ARTWORK LOADER MODUL =====
    window.ArtExplorerApp.ArtworkLoader = {
        /**
         * Initialisiert den Kunstwerk-Loader mit Intersection Observer
         */
        initialize() {
            console.log('🖼️ Initialisiere Artwork Loader...');
            this.setupIntersectionObserver();
            this.bindEvents();
            console.log('✅ Artwork Loader initialisiert');
        },

        /**
         * Richtet den Intersection Observer für unendliches Scrollen ein
         */
        setupIntersectionObserver() {
            const options = {
                root: document.getElementById('feedWrapper'),
                threshold: window.ArtExplorerApp.config.INTERSECTION_THRESHOLD
            };

            window.ArtExplorerApp.state.intersectionObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !window.ArtExplorerApp.state.isLoading) {
                    console.log('👁️ Intersection Observer ausgelöst - lade weitere Kunstwerke');
                    this.loadMoreArtworks();
                }
            }, options);

            const sentinel = document.getElementById('sentinelBottom');
            if (sentinel) {
                window.ArtExplorerApp.state.intersectionObserver.observe(sentinel);
                console.log('✅ Intersection Observer eingerichtet');
            } else {
                console.error('❌ Sentinel-Element nicht gefunden');
            }
        },

        /**
         * Lädt weitere Kunstwerke in den Feed
         */
        async loadMoreArtworks() {
            const state = window.ArtExplorerApp.state;
            const config = window.ArtExplorerApp.config;

            console.log(`🔄 Lade weitere Kunstwerke... (Pool: ${state.artworkPool.length}, Loading: ${state.isLoading})`);

            if (state.isLoading || state.artworkPool.length === 0) {
                console.log('⏸️ Laden übersprungen: Bereits am Laden oder Pool leer');
                return;
            }

            state.isLoading = true;
            window.ArtExplorerApp.UIManager.showLoader();

            let addedCount = 0;
            const maxAttempts = config.BATCH_SIZE * 5;
            let attempts = 0;
            const startTime = Date.now();
            const maxLoadTime = 10000;

            console.log(`📦 Starte Batch-Loading (Ziel: ${config.BATCH_SIZE} Kunstwerke)...`);

            while (addedCount < config.BATCH_SIZE &&
                state.artworkPool.length > 0 &&
                attempts < maxAttempts &&
                (Date.now() - startTime) < maxLoadTime) {

                attempts++;
                const artworkId = window.ArtExplorerApp.ArtworkAPI.getRandomArtworkId();

                if (!artworkId || state.seenArtworks.has(artworkId)) {
                    console.log(`⏭️ Überspringe Kunstwerk: ${artworkId} (bereits gesehen oder ungültig)`);
                    continue;
                }

                console.log(`🎯 Lade Kunstwerk: ${artworkId} (Versuch ${attempts}/${maxAttempts})`);

                try {
                    const artwork = await window.ArtExplorerApp.ArtworkAPI.loadArtwork(artworkId);

                    if (artwork) {
                        console.log(`✅ Kunstwerk erfolgreich geladen: ${artwork.title}`);
                        state.seenArtworks.add(artworkId);
                        this.addArtworkToFeed(artwork);
                        addedCount++;
                    } else {
                        console.log(`❌ Kunstwerk konnte nicht geladen werden: ${artworkId}`);
                    }
                } catch (error) {
                    console.error(`❌ Fehler beim Laden von Kunstwerk ${artworkId}:`, error);
                }

                // Kleine Pause alle 3 Versuche
                if (attempts % 3 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            console.log(`📊 Batch-Loading abgeschlossen: ${addedCount}/${config.BATCH_SIZE} Kunstwerke hinzugefügt`);

            window.ArtExplorerApp.UIManager.hideLoader();
            state.isLoading = false;

            if (addedCount === 0) {
                console.error('⚠️ Keine Kunstwerke konnten geladen werden');
                window.ArtExplorerApp.UIManager.showError('Keine Kunstwerke verfügbar. Bitte versuchen Sie es später erneut.');
            }

            // Pool nachfüllen wenn nötig
            if (state.artworkPool.length < 100) {
                console.log('🔄 Pool wird knapp - lade neue IDs nach...');
                try {
                    await window.ArtExplorerApp.ArtworkAPI.loadArtworkIds();
                } catch (error) {
                    console.error('❌ Fehler beim Nachladen der Kunstwerk-IDs:', error);
                }
            }
        },

        /**
         * Fügt ein Kunstwerk zum Feed hinzu
         * @param {Object} artwork - Kunstwerk-Daten
         */
        addArtworkToFeed(artwork) {
            const sentinel = document.getElementById('sentinelBottom');
            if (sentinel) {
                const artworkHtml = window.ArtExplorerApp.ArtworkRenderer.renderArtwork(artwork);
                sentinel.insertAdjacentHTML('beforebegin', artworkHtml);
                console.log(`➕ Kunstwerk zum Feed hinzugefügt: ${artwork.title}`);
                window.ArtExplorerApp.App.refreshTooltips();
            } else {
                console.error('❌ Sentinel-Element nicht gefunden beim Hinzufügen');
            }
        },

        /**
         * Bindet Event-Listener für Feed-Interaktionen
         */
        bindEvents() {
            const feedWrapper = document.getElementById('feedWrapper');
            if (!feedWrapper) {
                console.error('❌ Feed-Wrapper nicht gefunden');
                return;
            }

            feedWrapper.addEventListener('click', async (e) => {
                // Info-Button Handler
                if (e.target.closest('.btn-info')) {
                    const button = e.target.closest('.btn-info');
                    const artworkId = button.getAttribute('data-artwork-id');
                    console.log(`ℹ️ Info-Button geklickt für Kunstwerk: ${artworkId}`);
                    await window.ArtExplorerApp.ModalManager.showArtworkDetails(artworkId);
                }

                // Google-Button Handler
                if (e.target.closest('.btn-google')) {
                    const button = e.target.closest('.btn-google');
                    const artworkId = button.getAttribute('data-artwork-id');
                    console.log(`🔍 Google-Button geklickt für Kunstwerk: ${artworkId}`);
                    window.ArtExplorerApp.GoogleSearchManager.searchArtwork(artworkId);
                }
            });

            console.log('✅ Event-Listener für Feed eingerichtet');
        }
    };

    // ===== MODAL MANAGER MODUL =====
    window.ArtExplorerApp.ModalManager = {
        /**
         * Zeigt Kunstwerk-Details in einem Modal an
         * @param {number} artworkId - ID des Kunstwerks
         */
        async showArtworkDetails(artworkId) {
            try {
                console.log(`📋 Lade Kunstwerk-Details für Modal: ${artworkId}`);
                const artwork = await window.ArtExplorerApp.ArtworkAPI.loadArtwork(artworkId);
                if (!artwork) {
                    window.ArtExplorerApp.UIManager.showError('Kunstwerk-Details konnten nicht geladen werden.');
                    return;
                }

                window.ArtExplorerApp.state.currentArtwork = artwork;
                this.renderArtworkModal(artwork);

                const modalElement = document.getElementById('metaModal');
                if (modalElement && typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                    console.log(`✅ Modal geöffnet für: ${artwork.title}`);
                }
            } catch (error) {
                console.error('❌ Fehler beim Laden der Kunstwerk-Details:', error);
                window.ArtExplorerApp.UIManager.showError('Fehler beim Laden der Kunstwerk-Details.');
            }
        },

        /**
         * Rendert Kunstwerk-Daten in das Modal
         * @param {Object} artwork - Kunstwerk-Daten
         */
        renderArtworkModal(artwork) {
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');

            if (modalTitle) modalTitle.textContent = artwork.title || 'Werkdetails';

            const details = [{
                    label: 'Künstler',
                    value: artwork.artistDisplayName
                },
                {
                    label: 'Datum',
                    value: artwork.objectDate
                },
                {
                    label: 'Medium',
                    value: artwork.medium
                },
                {
                    label: 'Abteilung',
                    value: artwork.department
                },
                {
                    label: 'Klassifikation',
                    value: artwork.classification
                },
                {
                    label: 'Dimensionen',
                    value: artwork.dimensions
                },
                {
                    label: 'Kultur',
                    value: artwork.culture
                },
                {
                    label: 'Periode',
                    value: artwork.period
                },
                {
                    label: 'Akquisitionsjahr',
                    value: artwork.accessionYear
                },
                {
                    label: 'Credit Line',
                    value: artwork.creditLine
                }
            ];

            let html = '<dl class="row">';
            details.forEach(detail => {
                if (detail.value) {
                    html += `
          <dt class="col-sm-4">${detail.label}</dt>
          <dd class="col-sm-8">${detail.value}</dd>
        `;
                }
            });
            html += '</dl>';

            // Wikipedia-Link falls verfügbar
            if (artwork.objectWikidata_URL) {
                html += `<div class="mt-3">
        <a href="${artwork.objectWikidata_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm themed-btn" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Weitere Informationen auf Wikipedia">
          <i class="bi bi-wikipedia me-1"></i>Wikipedia
        </a>
      </div>`;
            }

            if (modalBody) modalBody.innerHTML = html;

            // Google-Button konfigurieren
            const googleBtn = document.getElementById('googleSearchBtn');
            if (googleBtn) {
                googleBtn.className = 'btn btn-primary themed-btn';
                googleBtn.onclick = () => window.ArtExplorerApp.GoogleSearchManager.searchArtwork(artwork.objectID);
                googleBtn.setAttribute('data-bs-toggle', 'tooltip');
                googleBtn.setAttribute('data-bs-placement', 'top');
                googleBtn.setAttribute('data-bs-title', 'Google-Suche für weitere Informationen zu diesem Kunstwerk');
            }

            // Tooltips nach kurzer Verzögerung aktualisieren
            setTimeout(() => window.ArtExplorerApp.App.refreshTooltips(), 100);
        }
    };

    // ===== GOOGLE SEARCH MANAGER MODUL =====
    window.ArtExplorerApp.GoogleSearchManager = {
        /**
         * Startet Google-Suche für ein Kunstwerk
         * @param {number} artworkId - ID des Kunstwerks
         */
        searchArtwork(artworkId) {
            console.log(`🔍 Starte Google-Suche für Kunstwerk: ${artworkId}`);
            const currentArtwork = window.ArtExplorerApp.state.currentArtwork;

            if (currentArtwork && currentArtwork.objectID == artworkId) {
                this.performSearch(currentArtwork);
            } else {
                console.log('📡 Lade Kunstwerk-Daten für Google-Suche...');
                window.ArtExplorerApp.ArtworkAPI.loadArtwork(artworkId).then(artwork => {
                    if (artwork) {
                        this.performSearch(artwork);
                    } else {
                        console.error('❌ Kunstwerk-Daten für Google-Suche nicht verfügbar');
                    }
                });
            }
        },

        /**
         * Führt die Google-Suche mit Kunstwerk-Daten durch
         * @param {Object} artwork - Kunstwerk-Daten
         */
        performSearch(artwork) {
            const title = artwork.title || '';
            const artist = artwork.artistDisplayName || '';
            const culture = artwork.culture || '';

            const searchTerms = [title, artist, culture, 'art', 'museum']
                .filter(Boolean)
                .join(' ');

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}`;
            console.log(`🌐 Öffne Google-Suche: "${searchTerms}"`);
            window.open(searchUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // ===== UI MANAGER MODUL =====
    window.ArtExplorerApp.UIManager = {
        /**
         * Zeigt den Lade-Indikator an
         */
        showLoader() {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'block';
                console.log('⏳ Lade-Indikator angezeigt');
            }
        },

        /**
         * Versteckt den Lade-Indikator
         */
        hideLoader() {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'none';
                console.log('✅ Lade-Indikator versteckt');
            }
        },

        /**
         * Zeigt eine Fehlermeldung als Toast an
         * @param {string} message - Fehlermeldung
         */
        showError(message) {
            console.error(`❌ Fehler: ${message}`);
            this.showToast(message, 'error');
        },

        /**
         * Zeigt eine Toast-Nachricht an
         * @param {string} message - Nachrichtentext
         * @param {string} type - Toast-Typ ('info', 'success', 'error', 'warning')
         * @param {number} duration - Anzeigedauer in ms
         */
        showToast(message, type = 'info', duration = 5000) {
            const toast = document.createElement('div');
            toast.className = `toast-message toast-${type}`;

            let bgColor = 'var(--accent)';
            let icon = 'bi-info-circle';

            switch (type) {
                case 'success':
                    bgColor = '#28a745';
                    icon = 'bi-check-circle';
                    console.log(`✅ Erfolg: ${message}`);
                    break;
                case 'error':
                    bgColor = '#dc3545';
                    icon = 'bi-exclamation-triangle';
                    console.error(`❌ Fehler: ${message}`);
                    break;
                case 'warning':
                    bgColor = '#ffc107';
                    icon = 'bi-exclamation-circle';
                    console.warn(`⚠️ Warnung: ${message}`);
                    break;
                default:
                    console.log(`ℹ️ Info: ${message}`);
            }

            toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 350px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: slideIn 0.3s ease-out;
    `;

            toast.innerHTML = `
      <i class="bi ${icon}"></i>
      <span>${message}</span>
    `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    };

    // ===== HAUPT-APP MODUL =====
    window.ArtExplorerApp.App = {
        /**
         * Initialisiert die gesamte Anwendung
         */
        async initialize() {
            try {
                console.log('🚀 ArtExplorer Lite Initialisierung gestartet');

                // Theme Manager initialisieren
                console.log('🎨 Initialisiere Theme Manager...');
                try {
                    window.ArtExplorerApp.ThemeManager.initialize();
                    console.log('✅ Theme Manager erfolgreich initialisiert');
                } catch (error) {
                    console.error('❌ Fehler beim Theme Manager:', error);
                }

                // Navigation Manager initialisieren
                console.log('🧭 Initialisiere Navigation Manager...');
                try {
                    window.ArtExplorerApp.NavigationManager.initialize();
                    console.log('✅ Navigation Manager erfolgreich initialisiert');
                } catch (error) {
                    console.error('❌ Fehler beim Navigation Manager:', error);
                }

                // Artwork Loader initialisieren
                console.log('🖼️ Initialisiere Artwork Loader...');
                try {
                    window.ArtExplorerApp.ArtworkLoader.initialize();
                    console.log('✅ Artwork Loader erfolgreich initialisiert');
                } catch (error) {
                    console.error('❌ Fehler beim Artwork Loader:', error);
                }

                // Tooltips initialisieren
                console.log('💡 Initialisiere Tooltips...');
                this.initializeTooltips();

                // Splash Screen starten
                console.log('⏳ Starte Splash Screen...');
                await window.ArtExplorerApp.SplashScreen.initialize();

                console.log('🎉 ArtExplorer Lite erfolgreich initialisiert');
            } catch (error) {
                console.error('❌ Kritischer Fehler bei der App-Initialisierung:', error);

                // Notfall-Verstecken des Splash Screens
                const splash = document.getElementById('splashScreen');
                if (splash) {
                    splash.style.display = 'none';
                }

                window.ArtExplorerApp.UIManager.showError('Fehler beim Laden der Anwendung. Bitte laden Sie die Seite neu.');
            }
        },

        /**
         * Initialisiert Tooltips (nur auf Desktop-Geräten)
         */
        initializeTooltips() {
            if (typeof bootstrap === 'undefined') {
                console.warn('⚠️ Bootstrap nicht verfügbar - Tooltips deaktiviert');
                return;
            }

            // Tooltips nur auf Desktop aktivieren
            const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
            if (isMobile) {
                console.log('📱 Mobile Gerät erkannt - Tooltips deaktiviert');
                return;
            }

            try {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function(tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl, {
                        trigger: 'hover focus',
                        delay: {
                            show: 500,
                            hide: 100
                        }
                    });
                });
                console.log(`🖥️ Desktop-Tooltips initialisiert: ${tooltipTriggerList.length} Elemente`);
            } catch (error) {
                console.error('❌ Fehler beim Initialisieren der Tooltips:', error);
            }
        },

        /**
         * Aktualisiert alle Tooltips (z.B. nach dynamischem Content)
         */
        refreshTooltips() {
            try {
                // Alte Tooltips entfernen
                const existingTooltips = document.querySelectorAll('.tooltip');
                existingTooltips.forEach(tooltip => tooltip.remove());

                // Nur auf Desktop Tooltips refreshen
                const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
                if (!isMobile) {
                    this.initializeTooltips();
                    console.log('🔄 Tooltips aktualisiert');
                }
            } catch (error) {
                console.error('❌ Fehler beim Aktualisieren der Tooltips:', error);
            }
        }
    };

    // ===== CSS ANIMATIONEN & THEME FIXES =====
    const cssAnimations = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  /* Modal Button Theme Integration */
  .themed-btn {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
    color: white !important;
  }

  .themed-btn:hover,
  .themed-btn:focus {
    background-color: var(--accent-hover) !important;
    border-color: var(--accent-hover) !important;
    color: white !important;
  }

  .btn-outline-primary.themed-btn {
    background-color: transparent !important;
    border-color: var(--accent) !important;
    color: var(--accent) !important;
  }

  .btn-outline-primary.themed-btn:hover,
  .btn-outline-primary.themed-btn:focus {
    background-color: var(--accent) !important;
    border-color: var(--accent) !important;
    color: white !important;
  }

  /* Dark Mode Artwork Card Fixes */
  [data-theme="dark"] .snap-item {
    background: #1a1a1a !important;
  }

  [data-theme="dark"] .snap-item .info-overlay {
    background: linear-gradient(transparent, rgba(10, 10, 10, 0.95)) !important;
  }

  [data-theme="dark"] .snap-item h3 a {
    color: #ffffff !important;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  [data-theme="dark"] .snap-item .meta {
    color: #cccccc !important;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  /* Remove white strips in dark mode */
  [data-theme="dark"] .snap-item::before,
  [data-theme="dark"] .snap-item::after {
    display: none;
  }

  /* Simple Modal centering - Desktop only */
  @media (min-width: 768px) {
    .modal {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .modal.show {
      display: flex !important;
    }

    .modal-dialog {
      margin: 1.75rem auto !important;
      max-width: 500px !important;
    }
  }

  /* Prevent zoom on input focus for iOS */
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  textarea,
  select {
    font-size: 16px !important;
  }
`;

    // CSS nur einmal hinzufügen
    if (!document.getElementById('artexplorer-animations')) {
        const style = document.createElement('style');
        style.id = 'artexplorer-animations';
        style.textContent = cssAnimations;
        document.head.appendChild(style);
        console.log('🎨 CSS-Animationen und Theme-Fixes hinzugefügt');
    }

    // ===== INITIALISIERUNG =====
    $(document).ready(function() {
        console.log('📄 DOM bereit - starte ArtExplorer Initialisierung');
        window.ArtExplorerApp.App.initialize();
    });

    // Schließe den Wrapper
    console.log('✅ ArtExplorer Lite Skript vollständig geladen');
}
