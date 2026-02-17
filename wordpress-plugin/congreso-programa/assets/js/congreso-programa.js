/**
 * Congreso Programa - WordPress Plugin JavaScript
 * Handles fetching data from ShockLogic API, rendering, filtering, and modals
 */

(function () {
    'use strict';

    // SVG Icons
    const Icons = {
        clock: '<svg class="cp-icon cp-icon-blue cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        mapPin: '<svg class="cp-icon cp-icon-blue cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
        userRound: '<svg class="cp-icon cp-icon-blue cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
        presentation: '<svg class="cp-icon cp-icon-blue cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>',
        arrowRight: '<svg class="cp-icon cp-icon-blue cp-svg-icon cp-arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
        coffee: '<svg class="cp-icon cp-icon-amber cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',
        utensils: '<svg class="cp-icon cp-icon-yellow cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
        utensilsCrossed: '<svg class="cp-icon cp-icon-orange cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c1.7 1.7 4.3 1.7 6 0L20 12"/><path d="m2 2 20 20"/></svg>',
        martini: '<svg class="cp-icon cp-icon-orange cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>',
        x: '<svg class="cp-icon cp-svg-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    };

    // Constants
    const API_BASE = 'https://api.shocklogic.com/v1.0';

    // State
    let programmeData = null;
    let countriesData = [];
    let selectedDay = null;
    let selectedRoom = null;
    let config = null;

    // Translations fallback
    const defaultTranslations = {
        ESP: {
            loading: 'Cargando programa...',
            loadingData: 'Cargando datos...',
            allRooms: 'Todas las salas',
            hour: 'Hora',
            session: 'Sesión',
            location: 'Ubicación',
            coordinates: 'Coordina y modera',
            presentations: 'Presentaciones',
            notAvailable: 'Información no disponible',
            room: 'Sala',
            errorLoading: 'Error al cargar el programa',
            noSessions: 'No hay sesiones para este día',
        },
        ENG: {
            loading: 'Loading programme...',
            loadingData: 'Loading data...',
            allRooms: 'All rooms',
            hour: 'Time',
            session: 'Session',
            location: 'Location',
            coordinates: 'Chair',
            presentations: 'Presentations',
            notAvailable: 'Information not available',
            room: 'Room',
            errorLoading: 'Error loading programme',
            noSessions: 'No sessions for this day',
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const containers = document.querySelectorAll('.congreso-programa-container');
        if (!containers.length) return;

        config = window.congressProgramaConfig || {};

        // Load countries data then process containers
        loadCountriesData().then(() => {
            containers.forEach(container => {
                const congressId = container.dataset.congressId;
                const lang = container.dataset.lang || 'ESP';
                loadProgramme(container, congressId, lang);
            });
        });
    }

    async function loadCountriesData() {
        const countriesUrl = config.countriesUrl;
        if (!countriesUrl) return;
        try {
            const response = await fetch(countriesUrl);
            countriesData = await response.json();
        } catch (error) {
            console.warn('Could not load countries data:', error);
        }
    }

    async function loadProgramme(container, congressId, lang) {
        const apiBase = config.apiBase || API_BASE;
        const apiUrl = `${apiBase}/${congressId}/Programme/1/0/`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('API request failed');

            programmeData = await response.json();

            const days = Object.keys(programmeData.Programme.Days);
            if (days.length > 0) {
                selectedDay = days[0];
            }

            renderProgramme(container, lang);
        } catch (error) {
            console.error('Error loading programme:', error);
            const t = getTranslations(lang);
            container.innerHTML = `<div class="cp-error">${t.errorLoading}</div>`;
        }
    }

    function getTranslations(lang) {
        return config.translations || defaultTranslations[lang] || defaultTranslations.ESP;
    }

    function renderProgramme(container, lang) {
        const t = getTranslations(lang);

        if (!programmeData || !programmeData.Programme || !programmeData.Programme.Days) {
            container.innerHTML = `<div class="cp-error">${t.errorLoading}</div>`;
            return;
        }

        const days = Object.keys(programmeData.Programme.Days);

        // Get sessions for selected day
        const dayData = programmeData.Programme.Days[selectedDay];
        const allSessions = Object.values(dayData.Session_Groups)
            .flatMap(group => group.Sessions)
            .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));

        // Get unique rooms
        const uniqueRooms = [...new Set(allSessions.map(s => s.Session_Location).filter(Boolean))];

        // Filter sessions by room if selected
        const sessions = selectedRoom
            ? allSessions.filter(s => s.Session_Location === selectedRoom)
            : allSessions;

        let html = '';

        // Day buttons
        html += '<div class="cp-days-container">';
        days.forEach(day => {
            const dayInfo = programmeData.Programme.Days[day];
            const dateStr = formatDate(dayInfo.Date_String, lang);
            const isActive = day === selectedDay ? 'active' : '';
            html += `<button class="cp-day-btn ${isActive}" data-day="${day}">${dateStr}</button>`;
        });
        html += '</div>';

        // Room filter (if more than one room)
        if (uniqueRooms.length > 1) {
            html += '<div class="cp-rooms-container">';
            html += `<button class="cp-room-btn ${selectedRoom === null ? 'active' : ''}" data-room="">${t.allRooms || 'All rooms'}</button>`;
            uniqueRooms.forEach(room => {
                const isActive = room === selectedRoom ? 'active' : '';
                html += `<button class="cp-room-btn ${isActive}" data-room="${escapeHtml(room)}">${escapeHtml(room)}</button>`;
            });
            html += '</div>';
        }

        // Desktop table
        html += renderDesktopTable(sessions, t, lang);

        // Mobile cards
        html += renderMobileCards(sessions, t, lang);

        container.innerHTML = html;

        // Attach event listeners
        const congressId = container.dataset.congressId;
        attachEventListeners(container, lang, congressId);
    }

    function renderDesktopTable(sessions, t, lang) {
        if (sessions.length === 0) {
            return `<div class="cp-table-container"><div class="cp-no-sessions">${t.noSessions || 'No sessions for this day'}</div></div>`;
        }

        let html = '<div class="cp-table-container">';
        html += '<table class="cp-table">';
        html += `<thead><tr>
            <th>${t.hour || 'Time'}</th>
            <th>${t.session || 'Session'}</th>
            <th>${t.location || 'Location'}</th>
        </tr></thead>`;
        html += '<tbody>';

        sessions.forEach(session => {
            html += '<tr>';

            // Time cell
            html += `<td class="cp-time-cell">
                <div class="cp-time-content">
                    ${Icons.clock}
                    ${session.Session_Start_Time} - ${session.Session_End_Time}
                </div>
            </td>`;

            // Session cell
            html += '<td class="cp-session-cell">';
            html += `<div class="cp-session-title">
                <span>${getSessionIcon(session.Session_Title)}</span>
                ${escapeHtml(session.Session_Title)}
            </div>`;

            if (session.Session_Chair) {
                html += `<div class="cp-session-chair">
                    ${Icons.userRound}
                    ${t.coordinates || 'Chair'}:
                    <span class="cp-session-chair-name">${escapeHtml(session.Session_Chair)}</span>
                </div>`;
            }

            // Presentations
            if (session.Presentations && session.Presentations.length > 0) {
                html += '<div class="cp-presentations">';
                session.Presentations.forEach((presentation, pIdx) => {
                    html += `<div class="cp-presentation${pIdx > 0 ? '' : ''}">`;
                    html += '<div class="cp-presentation-content">';

                    if (presentation.Presentation_Title) {
                        html += Icons.arrowRight;
                        html += `<div class="cp-presentation-title">${escapeHtml(presentation.Presentation_Title)}`;

                        // Authors
                        if (presentation.Abstract && presentation.Abstract.Authors && presentation.Abstract.Authors.length > 0) {
                            html += '<ul class="cp-authors-list">';
                            presentation.Abstract.Authors.forEach(author => {
                                html += `<li>${escapeHtml(author.First_Name)} ${escapeHtml(author.Family_Name)} - ${escapeHtml(author.Country_Name || '')} - ${escapeHtml(author.Company || '')}</li>`;
                            });
                            html += '</ul>';
                        }
                        html += '</div>';
                    }

                    // Speakers
                    if (presentation.AllSpeakers && presentation.AllSpeakers.length > 0) {
                        html += '<ul class="cp-speakers-list">';
                        presentation.AllSpeakers.forEach(speaker => {
                            html += `<li class="cp-speaker-item">
                                <img src="${speaker.Image01 || getDefaultAvatar()}" alt="${escapeHtml(speaker.Full_Name)}" class="cp-speaker-avatar" onerror="this.src='${getDefaultAvatar()}'">
                                <button class="cp-speaker-btn" data-faculty-id="${speaker.Faculty_Id}">${escapeHtml(speaker.Full_Name)}</button>
                            </li>`;
                        });
                        html += '</ul>';
                    }

                    html += '</div></div>';
                });
                html += '</div>';
            }

            html += '</td>';

            // Location cell
            html += `<td class="cp-location-cell">
                <div class="cp-location-content">
                    ${Icons.mapPin}
                    ${escapeHtml(session.Session_Location || '—')}
                </div>
            </td>`;

            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    function renderMobileCards(sessions, t, lang) {
        if (sessions.length === 0) {
            return `<div class="cp-mobile-cards"><div class="cp-no-sessions">${t.noSessions || 'No sessions for this day'}</div></div>`;
        }

        let html = '<div class="cp-mobile-cards">';

        sessions.forEach(session => {
            html += '<div class="cp-card">';

            // Time
            html += `<div class="cp-card-time">
                ${Icons.clock}
                ${session.Session_Start_Time} - ${session.Session_End_Time}
            </div>`;

            // Title
            html += `<div class="cp-card-title">
                ${session.Session_Title ? getSessionIcon(session.Session_Title) : ''}
                ${escapeHtml(session.Session_Title)}
            </div>`;

            // Type
            if (session.Session_Type) {
                html += `<div class="cp-card-type">${escapeHtml(session.Session_Type)}</div>`;
            }

            // Location
            html += `<div class="cp-card-location">
                ${Icons.mapPin}
                ${escapeHtml(session.Session_Location || '—')}
            </div>`;

            // Chair
            if (session.Session_Chair) {
                html += `<div class="cp-card-chair">
                    ${Icons.userRound}
                    ${t.coordinates || 'Chair'}: <span>${escapeHtml(session.Session_Chair)}</span>
                </div>`;
            }

            // Presentations
            if (session.Presentations && session.Presentations.length > 0) {
                html += '<div class="cp-card-presentations">';
                session.Presentations.forEach(presentation => {
                    html += '<div class="cp-card-presentation">';

                    if (presentation.Presentation_Title) {
                        html += `<div class="cp-card-presentation-title">
                            ${Icons.arrowRight}
                            ${escapeHtml(presentation.Presentation_Title)}
                        </div>`;

                        // Authors
                        if (presentation.Abstract && presentation.Abstract.Authors && presentation.Abstract.Authors.length > 0) {
                            html += '<ul class="cp-authors-list">';
                            presentation.Abstract.Authors.forEach(author => {
                                html += `<li>${escapeHtml(author.First_Name)} ${escapeHtml(author.Family_Name)} - ${escapeHtml(author.Country_Name || '')} - ${escapeHtml(author.Company || '')}</li>`;
                            });
                            html += '</ul>';
                        }
                    }

                    // Speakers
                    if (presentation.AllSpeakers && presentation.AllSpeakers.length > 0) {
                        html += '<ul class="cp-card-speakers">';
                        presentation.AllSpeakers.forEach(speaker => {
                            html += `<li class="cp-card-speaker">
                                <img src="${speaker.Image01 || getDefaultAvatar()}" alt="${escapeHtml(speaker.Full_Name)}" class="cp-card-speaker-avatar" onerror="this.src='${getDefaultAvatar()}'">
                                <button class="cp-speaker-btn" data-faculty-id="${speaker.Faculty_Id}">${escapeHtml(speaker.Full_Name)}</button>
                            </li>`;
                        });
                        html += '</ul>';
                    }

                    html += '</div>';
                });
                html += '</div>';
            }

            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    function attachEventListeners(container, lang, congressId) {
        // Day buttons
        container.querySelectorAll('.cp-day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDay = btn.dataset.day;
                selectedRoom = null;
                renderProgramme(container, lang);
            });
        });

        // Room buttons
        container.querySelectorAll('.cp-room-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedRoom = btn.dataset.room || null;
                renderProgramme(container, lang);
            });
        });

        // Speaker buttons
        container.querySelectorAll('.cp-speaker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const facultyId = btn.dataset.facultyId;
                openFacultyModal(facultyId, lang, congressId);
            });
        });
    }

    async function openFacultyModal(facultyId, lang, congressId) {
        const t = getTranslations(lang);

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'cp-modal-overlay';
        overlay.innerHTML = `
            <div class="cp-modal">
                <button class="cp-modal-close">${Icons.x}</button>
                <div class="cp-modal-content">
                    <div class="cp-loader">
                        <div class="cp-loader-spinner"></div>
                        <p>${t.loadingData}</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Close button
        overlay.querySelector('.cp-modal-close').addEventListener('click', () => closeModal(overlay));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });

        // Fetch faculty data
        try {
            const apiBase = config.apiBase || API_BASE;
            const apiUrl = `${apiBase}/${congressId}/Faculty/${facultyId}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!response.ok || !data || !data.length) {
                renderModalNotFound(overlay, t);
            } else {
                renderModalContent(overlay, data[0], t, lang);
            }
        } catch (error) {
            console.error('Error loading faculty:', error);
            renderModalNotFound(overlay, t);
        }
    }

    function renderModalContent(overlay, faculty, t, lang) {
        const countryData = getCountryData(faculty.Country_Name);

        let html = `
            <div class="cp-modal-header">
                <img src="${faculty.Image01 || getDefaultAvatar()}" alt="${escapeHtml(faculty.First_Name)}" class="cp-modal-avatar" onerror="this.src='${getDefaultAvatar()}'">
                <div>
                    <h2 class="cp-modal-name">
                        ${escapeHtml(faculty.Prefix_Title || '')} ${escapeHtml(faculty.First_Name)} ${escapeHtml(faculty.Family_Name)} ${escapeHtml(faculty.Suffix_Title || '')}
                    </h2>
                    ${countryData ? `
                        <div class="cp-modal-country">
                            <img src="${countryData.flag}" alt="Flag of ${escapeHtml(countryData.name_en)}" class="cp-modal-flag">
                            <span>${escapeHtml(faculty.Country_Name)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (faculty.Biography) {
            html += `<div class="cp-modal-biography">${faculty.Biography}</div>`;
        }

        if (faculty.Assignments && faculty.Assignments.presentations && faculty.Assignments.presentations.length > 0) {
            html += `
                <div class="cp-modal-presentations">
                    <h3 class="cp-modal-presentations-title">${t.presentations || 'Presentations'}:</h3>
                    <ul class="cp-modal-presentations-list">
            `;

            faculty.Assignments.presentations.forEach(p => {
                html += `
                    <li>
                        <p class="cp-modal-presentation-title">${escapeHtml(p.Presentation_Title)}</p>
                        <p class="cp-modal-presentation-details">${escapeHtml(p.Session_Title)} – ${p.Session_Start_Time} - ${p.Session_End_Time}</p>
                        <p class="cp-modal-presentation-room">${t.room || 'Room'}: ${escapeHtml(p.Room_Name)}</p>
                    </li>
                `;
            });

            html += '</ul></div>';
        }

        overlay.querySelector('.cp-modal-content').innerHTML = html;
    }

    function renderModalNotFound(overlay, t) {
        overlay.querySelector('.cp-modal-content').innerHTML = `
            <div class="cp-modal-notfound">
                <svg class="cp-modal-notfound-img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <p>${t.notAvailable || 'Information not available'}</p>
            </div>
        `;
    }

    function closeModal(overlay) {
        document.body.style.overflow = '';
        overlay.remove();
    }

    // Helper functions
    function formatDate(dateString, lang) {
        const date = new Date(dateString);
        const locale = lang === 'ESP' ? 'es-ES' : 'en-US';
        return date.toLocaleDateString(locale, {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        });
    }

    function getSessionIcon(title) {
        if (!title) return Icons.presentation;
        const lower = title.toLowerCase();
        if (lower.includes('cena')) return Icons.utensilsCrossed;
        if (lower.includes('cocktail')) return Icons.martini;
        if (lower.includes('almuerzo') || lower.includes('lunch')) return Icons.utensils;
        if (lower.includes('coffee') || lower.includes('café') || lower.includes('cafe')) return Icons.coffee;
        return Icons.presentation;
    }

    function getCountryData(countryName) {
        if (!countryName || !countriesData.length) return null;
        return countriesData.find(c =>
            c.name_en.toLowerCase() === countryName.toLowerCase() ||
            c.name_es.toLowerCase() === countryName.toLowerCase()
        );
    }

    function getDefaultAvatar() {
        return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9CA3AF"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
