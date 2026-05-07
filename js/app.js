const OFFICIAL_HOLIDAYS = ["01-01", "01-06", "04-02", "04-03", "04-06", "05-01", "07-25", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"];
const DEFAULT_SETTINGS = {
    // Bolsa anual
    work: 1592,
    jornadaTipo: 'full',
    // AMB: M/T = 7h
    ambDay: 7.0,
    // HOSPITAL
    hosDayBase: 7.0, 
    hosNightBase: 10.0, 
    hosE12: 12.0,
    solDay: 0.17,
    solNight: 1.17,
    // Vacaciones: Diurna = 7h, Nocturna = 10h
    vacation: 168, vacDay: 7, vacNight: 10,
    // AP: M/T = 7h, N = 10h
    ap: 45, apDay: 7, apNight: 10,
    proporcional: true
};

const translations = {
    es: {
        balance: "Balance Exceso / Defecto", vacation: "Vacaciones", ap: "Horas AP",
        startContract: "Inicio Contrato", endContract: "Fin Contrato", settings: "Ajustes",
        lang: "Idioma / Hizkuntza", holidays: "Festivos Locales", add: "Añadir",
        annualBag: "Bolsa Anual (Horas)", shiftValue: "Turnos hospital",
        apVacValue: "VACACIONES",
        dataTitle: "Datos y Backup", pdf: "Descargar PDF", export: "Exportar Copia JSON",
        import: "Restaurar Copia", reset: "Borrar datos de contrato y turnos",
        work: "Laboral", vacs: "Vacas", delete: "Borrar", save: "Guardar",
        overlap: "Solape (Minutos)", cal: "Calendario", dat: "Datos",
        vDay: "Diurna", vNight: "Nocturna", amb: "AMBULA", hos: "HOSPITAL",
        bag_full: "Completa (1592 h)", bag_half: "½ Jornada (×0,5)", bag_third: "⅓ Jornada (×0,333)",
        bag_twothirds: "⅔ Jornada (×0,667)",
        ambHours: "AMBULA — horas", mtShift: "Mañana / Tarde (M–T)",
        hosBase: "HOSPITAL — Turnos Base (h)", mtBase: "M/T Base", nBase: "Noche Base", hosE: "Turno E",
        solTitle: "Incrementos por Solape (h)", vacAnnual: "Horas anuales", vacDay: "Día diurno (h)", vacNight: "Día nocturno (h)",
        apTitle: "AP (Asuntos Propios)", apDay: "M/T (h)", apNight: "Noche (N)"
    },
    eu: {
        balance: "Oreka Gehiegizkoa / Gutxiegizkoa", vacation: "Oporrak", ap: "AP Orduak",
        startContract: "Kontratu Hasiera", endContract: "Kontratu Amaiera", settings: "Ezarpenak",
        lang: "Hizkuntza / Idioma", holidays: "Herriko Jaiak", add: "Gehitu",
        annualBag: "Urteko Poltsa (Orduak)", shiftValue: "Hospital lanaldiak",
        apVacValue: "OPORRAK",
        dataTitle: "Datuak eta Backup", pdf: "PDFa Deskargatu", export: "JSON Kopia Esportatu",
        import: "Kopia Berreskuratu", reset: "Kontratu eta txanda datuak ezabatu",
        work: "Lanekoa", vacs: "Oporrak", delete: "Ezabatu", save: "Gorde",
        overlap: "Solapea (Minutuak)", cal: "Egutegia", dat: "Datuak",
        vDay: "Egunekoa", vNight: "Gauekoa", amb: "AMBULA", hos: "HOSPITAL",
        bag_full: "Osoa (1592 h)", bag_half: "½ Lanaldi (×0,5)", bag_third: "⅓ Lanaldi (×0,333)",
        bag_twothirds: "⅔ Lanaldi (×0,667)",
        ambHours: "AMBULA — orduak", mtShift: "Goiza / Arratsaldea (G–A)",
        hosBase: "HOSPITAL — Oinarrizko Txandak (h)", mtBase: "G/A Oinarria", nBase: "Gaua Oinarria", hosE: "E Txanda",
        solTitle: "Solape gehikuntzak (h)", vacAnnual: "Urteko orduak", vacDay: "Eguneko ordua (h)", vacNight: "Gaueko ordua (h)",
        apTitle: "AP (Norberarentzako Egunak)", apDay: "G/A (h)", apNight: "Gaua (G)"
    }
};

let state = {
    history: JSON.parse(localStorage.getItem('osaki_history')) || [],
    contract: JSON.parse(localStorage.getItem('osaki_contract')) || { start: '', end: '' },
    settings: Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem('osaki_settings') || '{}')),
    localHolidays: JSON.parse(localStorage.getItem('osaki_local_holidays')) || [],
    lang: localStorage.getItem('osaki_lang') || 'es'
};

let viewDate = new Date();
let selectedShiftHours = 0;
let currentType = 'work';
let lastSelectedBtnLabel = '';

function formatHours(decimal) {
    const isNegative = decimal < 0;
    const absVal = Math.abs(decimal);
    let h = Math.floor(absVal);
    let m = Math.round((absVal - h) * 60);
    if (m === 60) { h++; m = 0; }
    return `${isNegative ? '-' : ''}${h}h ${String(m).padStart(2, '0')}m`;
}

document.addEventListener('DOMContentLoaded', () => {
    syncInputs();
    renderLocalHolidays();
    recalculateEverything();
    renderCalendar();
    applyLanguage();
});

function applyLanguage() {
    const l = translations[state.lang];
    const map = {
        'label-balance': l.balance, 'label-vac-top': l.vacation, 'label-ap-top': l.ap,
        'label-start': l.startContract, 'label-end': l.endContract, 'title-settings': l.settings,
        'label-lang': l.lang, 'label-holidays': l.holidays, 'btn-add-holiday': l.add,
        'label-bag': l.annualBag, 'label-set-vac': l.vacation.substring(0, 5).toUpperCase(),
        'label-shift-val': l.shiftValue, 'label-shift-apvac': l.apVacValue,
        'title-data': l.dataTitle, 'btn-pdf': l.pdf, 'btn-export': l.export, 'btn-import': l.import,
        'btn-reset': l.reset, 'type-hos': l.hos, 'type-amb': l.amb, 'type-vacation': l.vacs, 'btn-delete': l.delete,
        'btn-save': l.save, 'label-overlap': l.overlap, 'nav-label-cal': l.cal,
        'nav-label-set': l.settings, 'nav-label-dat': l.dat,
        'label-vac-day': l.vDay, 'label-vac-night': l.vNight,
        'opt-full': l.bag_full, 'opt-half': l.bag_half, 'opt-third': l.bag_third, 'opt-twothirds': l.bag_twothirds,
        'label-amb-hours': l.ambHours, 'label-amb-day': l.mtShift,
        'label-hos-base': l.hosBase, 'label-mt-base': l.mtBase, 'label-n-base': l.nBase, 'label-hos-e': l.hosE,
        'label-sol-title': l.solTitle, 'label-sol-day': l.mtBase, 'label-sol-night': l.nBase,
        'label-vac-annual': l.vacAnnual, 'label-vac-d': l.vacDay, 'label-vac-n': l.vacNight,
        'label-ap-title': l.apTitle, 'label-ap-annual': l.vacAnnual, 'label-ap-d': l.apDay, 'label-ap-n': l.apNight
    };
    for (let id in map) {
        const el = document.getElementById(id);
        if (el) el.innerText = map[id];
    }
    document.getElementById('lang-es').className = `flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${state.lang === 'es' ? 'hospi-blue text-white border-transparent' : 'bg-white text-slate-400 border-slate-100'}`;
    document.getElementById('lang-eu').className = `flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${state.lang === 'eu' ? 'hospi-blue text-white border-transparent' : 'bg-white text-slate-400 border-slate-100'}`;
}

function syncInputs() {
    const s = state.settings;
    document.getElementById('set-work').value = s.work;
    document.getElementById('set-jornada-tipo').value = s.jornadaTipo;
    document.getElementById('set-amb-day').value = s.ambDay;
    document.getElementById('set-hos-day-base').value = s.hosDayBase;
    document.getElementById('set-hos-night-base').value = s.hosNightBase;
    document.getElementById('set-work-d12').value = s.hosE12;
    document.getElementById('set-sol-day').value = s.solDay;
    document.getElementById('set-sol-night').value = s.solNight;
    document.getElementById('set-vac').value = s.vacation;
    document.getElementById('set-vac-day').value = s.vacDay;
    document.getElementById('set-vac-night').value = s.vacNight;
    document.getElementById('set-ap').value = s.ap;
    document.getElementById('set-ap-day').value = s.apDay;
    document.getElementById('set-ap-night').value = s.apNight;
    document.getElementById('set-ap').value = s.ap;
    if (state.contract.start) document.getElementById('start-date').value = state.contract.start;
    if (state.contract.end) document.getElementById('end-date').value = state.contract.end;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    document.getElementById('current-month-year').innerText = new Intl.DateTimeFormat(state.lang === 'eu' ? 'eu-ES' : 'es-ES', { month: 'long', year: 'numeric' }).format(viewDate);

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    let startOffset = (firstDay === 0) ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i++) grid.innerHTML += `<div class="bg-slate-50 h-16 opacity-50"></div>`;

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const shift = state.history.find(e => e.date === dateStr);
        const holiday = isHoliday(dateStr);
        const inContract = state.contract.start && state.contract.end &&
            new Date(dateStr) >= new Date(state.contract.start) &&
            new Date(dateStr) <= new Date(state.contract.end);

        let cssClass = inContract ? 'bg-white' : 'day-off-contract';
        if (shift) {
            if (shift.type === 'vacation') cssClass = 'day-vacation';
            else if (shift.type === 'ap') cssClass = 'day-ap';
            else if (holiday) cssClass = 'day-holiday';
            else cssClass = 'day-work';
        } else if (holiday && inContract) cssClass = 'day-holiday';

        let icons = '';
        if (holiday) icons += '<span class="absolute top-1 right-1 text-[8px] text-red-500 font-black">★</span>';

        // Iconos específicos para Vacaciones (Sol/Luna) sin texto
        if (shift && shift.type === 'vacation') {
            const isNightV = shift.btnLabel === 'V-N';
            icons += `<span class="absolute top-1 left-1 text-[8px] text-orange-500 font-black"><i class="fas fa-${isNightV ? 'moon' : 'sun'}"></i></span>`;
        }

        grid.innerHTML += `
            <div onclick="attemptOpenDay('${dateStr}', ${inContract})" class="${cssClass} h-16 border-r border-b border-slate-100 flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform">
                ${icons}
                <span class="text-xs font-bold ${holiday ? 'text-red-600' : ''}">${day}</span>
                ${shift && shift.btnLabel && shift.type !== 'vacation' ? `<span class="text-[10px] mt-1 badge-${shift.btnLabel}">${shift.btnLabel}</span>` : ''}
            </div>`;
    }
}

function openDay(date) {
    document.getElementById('input-date').value = date;
    document.getElementById('modal-date-title').innerText = new Date(date).toLocaleDateString(state.lang === 'eu' ? 'eu-ES' : 'es-ES', { day: 'numeric', month: 'long' });
    const existing = state.history.find(e => e.date === date);
    if (existing) {
        selectMainType(existing.type);
        document.getElementById('input-overlap-check').checked = !!existing.overlap;
        if (existing.btnLabel) {
            const btnId = `btn-${existing.type}-${existing.btnLabel}`;
            const btn = document.getElementById(btnId);
            if (btn) setShift(existing.btnLabel, btn);
        }
        document.getElementById('btn-delete').classList.remove('hidden');
    } else {
        selectMainType('hos'); 
        document.getElementById('input-overlap-check').checked = true;
        // Inicializamos con un turno por defecto (M) para que selectedShiftHours no sea 0
        const defaultBtn = document.getElementById('btn-hos-M');
        if (defaultBtn) setShift('M', defaultBtn);
        document.getElementById('btn-delete').classList.add('hidden');
    }
    document.getElementById('shift-modal').classList.remove('hidden');
}

function selectMainType(type) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-600'));
    const btn = document.getElementById(`type-${type}`);
    if (btn) btn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-600');
    
    document.getElementById('shifts-amb').classList.toggle('hidden', type !== 'amb');
    document.getElementById('shifts-hos').classList.toggle('hidden', type !== 'hos');
    document.getElementById('shifts-vacation').classList.toggle('hidden', type !== 'vacation');
    document.getElementById('shifts-ap').classList.toggle('hidden', type !== 'ap');
    
    // El solape solo se muestra para HOSPITAL
    document.getElementById('overlap-container').classList.toggle('hidden', type !== 'hos');
}

function setShift(type, btn) {
    document.querySelectorAll('.shift-btn').forEach(b => b.classList.remove('shift-selected-M', 'shift-selected-T', 'shift-selected-N', 'shift-selected-D', 'shift-selected-E', 'shift-selected-V-D', 'shift-selected-V-N'));
    btn.classList.add(`shift-selected-${type}`);
    lastSelectedBtnLabel = type;
    updateShiftValue();
}

function updateShiftValue() {
    const s = state.settings;
    selectedShiftHours = calculateShiftHours(currentType, lastSelectedBtnLabel, document.getElementById('input-overlap-check').checked, s);
}

function calculateShiftHours(mainType, btnLabel, hasOverlap, s) {
    let hours = 0;
    if (mainType === 'amb') {
        hours = s.ambDay;
    } else if (mainType === 'hos') {
        if (btnLabel === 'N') {
            hours = hasOverlap ? (s.hosNightBase + s.solNight) : s.hosNightBase;
        } else if (btnLabel === 'E') {
            hours = s.hosE12;
        } else { // M o T
            hours = hasOverlap ? (s.hosDayBase + s.solDay) : s.hosDayBase;
        }
    } else if (mainType === 'vacation') {
        hours = (btnLabel === 'V-N') ? s.vacNight : s.vacDay;
    } else if (mainType === 'ap') {
        hours = (btnLabel === 'N') ? s.apNight : s.apDay;
    }

    // REDUCCIÓN DE JORNADA: Se aplica a todo (turno y solapes) proporcionalmente
    hours = jornadaHoras(hours, s.jornadaTipo);

    return applyRounding(hours, s.redondeoMin);
}

function saveShift() {
    const date = document.getElementById('input-date').value;
    const hasOverlap = currentType === 'hos' ? document.getElementById('input-overlap-check').checked : false;
    state.history = state.history.filter(e => e.date !== date);
    state.history.push({ 
        date, 
        type: currentType, 
        real: selectedShiftHours, 
        overlap: hasOverlap, 
        btnLabel: lastSelectedBtnLabel 
    });
    localStorage.setItem('osaki_history', JSON.stringify(state.history));
    recalculateEverything(); renderCalendar(); closeModal();
}

function updateSettings() {
    const g = id => document.getElementById(id);
    state.settings = {
        work: parseFloat(g('set-work').value) || 1592,
        jornadaTipo: g('set-jornada-tipo').value,
        redondeoMin: 0,
        ambDay: parseFloat(g('set-amb-day').value) || 7.0,
        hosDayBase: parseFloat(g('set-hos-day-base').value) || 7.0,
        hosNightBase: parseFloat(g('set-hos-night-base').value) || 10.0,
        hosE12: parseFloat(g('set-work-d12').value) || 12.0,
        solDay: parseFloat(g('set-sol-day').value) || 0.17,
        solNight: parseFloat(g('set-sol-night').value) || 1.17,
        vacation: parseFloat(g('set-vac').value) || 168,
        vacDay: parseFloat(g('set-vac-day').value) || 7,
        vacNight: parseFloat(g('set-vac-night').value) || 10,
        ap: parseFloat(g('set-ap').value) || 45,
        apDay: parseFloat(g('set-ap-day').value) || 7,
        apNight: parseFloat(g('set-ap-night').value) || 10,
        proporcional: true
    };
    localStorage.setItem('osaki_settings', JSON.stringify(state.settings));
    recalculateEverything();
}

// Funciones Auxiliares
function isHoliday(dateStr) { return OFFICIAL_HOLIDAYS.includes(dateStr.substring(5)) || state.localHolidays.includes(dateStr); }
function changeLanguage(l) { state.lang = l; localStorage.setItem('osaki_lang', l); applyLanguage(); renderCalendar(); }
function closeModal() { document.getElementById('shift-modal').classList.add('hidden'); }
function changeMonth(o) { viewDate.setMonth(viewDate.getMonth() + o); renderCalendar(); }
function attemptOpenDay(d, inC) { if (!state.contract.start || !state.contract.end) { alert(state.lang === 'eu' ? "Kontratuaren datak ezarri" : "Configura fechas contrato"); return; } if (inC) openDay(d); }

// Aplica redondeo configurable (en minutos) a horas decimales
function applyRounding(hours, roundMin) {
    if (!roundMin || roundMin <= 0) return hours;
    const totalMin = hours * 60;
    const rounded = Math.round(totalMin / roundMin) * roundMin;
    return rounded / 60;
}

// Calcula horas de bolsa trabajo según tipo de jornada
function jornadaHoras(baseHours, tipo) {
    switch (tipo) {
        case 'half': return baseHours * 0.5;
        case 'third': return baseHours * 0.3333;
        case 'two_thirds': return baseHours * 0.6667;
        default: return baseHours; // full
    }
}

function recalculateEverything() {
    const s = state.settings;
    let ratios = { work: 0, vac: 0, ap: 0 };
    
    if (state.contract.start && state.contract.end) {
        const start = new Date(state.contract.start);
        const end = new Date(state.contract.end);
        if (!isNaN(start) && !isNaN(end)) {
            const diff = Math.ceil(Math.abs(end - start) / 86400000) + 1;
            const r = s.proporcional ? Math.min(diff / 365, 1) : 1;
            ratios.work = jornadaHoras(s.work || 1592, s.jornadaTipo) * r;
            ratios.vac = jornadaHoras(s.vacation || 168, s.jornadaTipo) * r;
            ratios.ap = jornadaHoras(s.ap || 45, s.jornadaTipo) * r;
        }
    }

    let worked = 0, uVac = 0, uAP = 0;
    state.history.forEach(e => {
        // Recalculamos el valor real según los ajustes actuales para que sea dinámico
        if (e.type && e.btnLabel) {
            e.real = calculateShiftHours(e.type, e.btnLabel, e.overlap, s);
        }
        
        const val = parseFloat(e.real) || 0;
        const type = (e.type || "").toLowerCase();
        
        if (['amb', 'hos', 'work'].includes(type)) {
            worked += val;
        } else if (type === 'vacation') {
            uVac += val;
        } else if (type === 'ap') {
            uAP += val;
        }
    });

    const balance = worked - ratios.work;
    
    const balanceEl = document.getElementById('total-balance');
    const maxBalanceEl = document.getElementById('max-balance');
    if (balanceEl) {
        balanceEl.innerText = formatHours(balance);
        balanceEl.classList.remove('balance-positive', 'balance-negative');
        if (balance > 0.001) balanceEl.classList.add('balance-positive');
        else if (balance < -0.001) balanceEl.classList.add('balance-negative');
    }
    if (maxBalanceEl) {
        maxBalanceEl.innerText = `/ ${formatHours(ratios.work)}`;
    }

    const vacEl = document.getElementById('remaining-vac');
    const maxVacEl = document.getElementById('max-vac');
    if (vacEl) vacEl.innerText = formatHours(ratios.vac - uVac);
    if (maxVacEl) maxVacEl.innerText = `/ ${formatHours(ratios.vac)}`;
    
    const apEl = document.getElementById('remaining-ap');
    const maxApEl = document.getElementById('max-ap');
    if (apEl) apEl.innerText = formatHours(ratios.ap - uAP);
    if (maxApEl) maxApEl.innerText = `/ ${formatHours(ratios.ap)}`;
}

function addLocalHoliday() {
    const v = document.getElementById('local-holiday-input').value;
    if (v && !state.localHolidays.includes(v)) {
        state.localHolidays.push(v);
        localStorage.setItem('osaki_local_holidays', JSON.stringify(state.localHolidays));
        renderLocalHolidays(); renderCalendar();
    }
}
function removeLocalHoliday(d) {
    state.localHolidays = state.localHolidays.filter(x => x !== d);
    localStorage.setItem('osaki_local_holidays', JSON.stringify(state.localHolidays));
    renderLocalHolidays(); renderCalendar();
}
function renderLocalHolidays() {
    const list = document.getElementById('local-holidays-list');
    list.innerHTML = '';
    state.localHolidays.forEach(d => {
        list.innerHTML += `<span class="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">${d.split('-').reverse().slice(0, 2).join('/')} <i class="fas fa-times cursor-pointer" onclick="removeLocalHoliday('${d}')"></i></span>`;
    });
}
function updateContract() {
    state.contract = { start: document.getElementById('start-date').value, end: document.getElementById('end-date').value };
    localStorage.setItem('osaki_contract', JSON.stringify(state.contract));
    recalculateEverything(); renderCalendar();
}
function exportBackup() {
    const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "osaki_backup.json"; a.click();
}
function importBackup(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        state = JSON.parse(e.target.result);
        localStorage.setItem('osaki_history', JSON.stringify(state.history));
        localStorage.setItem('osaki_settings', JSON.stringify(state.settings));
        localStorage.setItem('osaki_contract', JSON.stringify(state.contract));
        localStorage.setItem('osaki_local_holidays', JSON.stringify(state.localHolidays || []));
        localStorage.setItem('osaki_lang', state.lang || 'es');
        location.reload();
    };
    reader.readAsText(file);
}
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x => { x.classList.add('text-slate-400'); x.classList.remove('active'); });
    document.getElementById(`tab-${t}`).classList.add('active');
    document.getElementById(`nav-${t}`).classList.add('active');
    document.getElementById(`nav-${t}`).classList.remove('text-slate-400');
}
async function exportToPDF() {
    const { jsPDF } = window.jspdf; const doc = new jsPDF();
    doc.text(`HospiTime - Report`, 14, 20);
    const rows = state.history.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => [new Date(e.date).toLocaleDateString(), e.type.toUpperCase(), e.btnLabel || '-', formatHours(e.real)]);
    doc.autoTable({ head: [['Data', 'Tipo', 'Txanda', 'H:min']], body: rows, startY: 30 });
    doc.save("Cuadrante.pdf");
}
function deleteCurrentDay() {
    state.history = state.history.filter(e => e.date !== document.getElementById('input-date').value);
    localStorage.setItem('osaki_history', JSON.stringify(state.history));
    recalculateEverything(); renderCalendar(); closeModal();
}

function resetAllData() { if (confirm("¿Borrar?")) { localStorage.clear(); location.reload(); } }

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Si creaste el contenedor de instalación en el HTML, lo mostramos aquí
    const installBtn = document.getElementById('install-container');
    if (installBtn) installBtn.classList.remove('hidden');
});

// Función para llamar desde el botón de "Instalar" en Ajustes
async function triggerInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') deferredPrompt = null;
    }
}

